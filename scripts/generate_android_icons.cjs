const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- PNG Decoder ---
function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  let idats = [];
  let offset = 8;
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idats.push(buf.slice(offset + 8, offset + 8 + len));
    offset += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idats));
  const pixels = Buffer.alloc(w * h * 4);
  const stride = w * 4;
  let srcPos = 0;
  for (let y = 0; y < h; y++) {
    const filter = decompressed[srcPos++];
    const lineStart = y * stride;
    const prevLineStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      let b = decompressed[srcPos++];
      const left = x >= 4 ? pixels[lineStart + x - 4] : 0;
      const up = y > 0 ? pixels[prevLineStart + x] : 0;
      const upLeft = (y > 0 && x >= 4) ? pixels[prevLineStart + x - 4] : 0;
      if (filter === 1) b = (b + left) & 0xff;
      else if (filter === 2) b = (b + up) & 0xff;
      else if (filter === 3) b = (b + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const pr = (pa <= pb && pa <= pc) ? left : (pb <= pc ? up : upLeft);
        b = (b + pr) & 0xff;
      }
      pixels[lineStart + x] = b;
    }
  }
  return { w, h, pixels };
}

// --- PNG Encoder ---
function encodePNG(w, h, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    return crc ^ -1;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    buf.writeInt32BE(crc32(buf.slice(4, 8 + len)), 8 + len);
    return buf;
  }

  const stride = w * 4;
  const rawData = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    rawData[y * (stride + 1)] = 0;
    rgbaBuffer.copy(rawData, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(rawData, { level: 9 })),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Bilinear sampling from source image
function sampleBilinear(src, u, v) {
  if (u < 0 || u >= src.w - 1 || v < 0 || v >= src.h - 1) {
    const x = Math.max(0, Math.min(src.w - 1, Math.round(u)));
    const y = Math.max(0, Math.min(src.h - 1, Math.round(v)));
    const idx = (y * src.w + x) * 4;
    return [src.pixels[idx], src.pixels[idx+1], src.pixels[idx+2], src.pixels[idx+3]];
  }
  const x0 = Math.floor(u), y0 = Math.floor(v);
  const x1 = x0 + 1, y1 = y0 + 1;
  const fx = u - x0, fy = v - y0;
  const fx1 = 1 - fx, fy1 = 1 - fy;

  const i00 = (y0 * src.w + x0) * 4;
  const i10 = (y0 * src.w + x1) * 4;
  const i01 = (y1 * src.w + x0) * 4;
  const i11 = (y1 * src.w + x1) * 4;

  const res = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    const val = (src.pixels[i00 + c] * fx1 + src.pixels[i10 + c] * fx) * fy1 +
                (src.pixels[i01 + c] * fx1 + src.pixels[i11 + c] * fx) * fy;
    res[c] = Math.max(0, Math.min(255, Math.round(val)));
  }
  return res;
}

// Alpha blend overlay onto dest
function blendPixel(dest, dIdx, srcColor) {
  const [sr, sg, sb, sa] = srcColor;
  if (sa === 0) return;
  const dr = dest[dIdx], dg = dest[dIdx+1], db = dest[dIdx+2], da = dest[dIdx+3];
  if (sa === 255 || da === 0) {
    dest[dIdx] = sr;
    dest[dIdx+1] = sg;
    dest[dIdx+2] = sb;
    dest[dIdx+3] = sa;
    return;
  }
  const aNorm = sa / 255;
  const invA = 1 - aNorm;
  dest[dIdx] = Math.round(sr * aNorm + dr * invA);
  dest[dIdx+1] = Math.round(sg * aNorm + dg * invA);
  dest[dIdx+2] = Math.round(sb * aNorm + db * invA);
  dest[dIdx+3] = Math.max(da, sa);
}

// Check distance to rounded squircle mask
function isInSquircle(x, y, size, radius) {
  const cx = size / 2;
  const cy = size / 2;
  const half = size / 2;
  const cornerDist = half - radius;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  if (dx <= cornerDist || dy <= cornerDist) return 1.0;
  if (dx > half || dy > half) return 0.0;

  const cornerDx = dx - cornerDist;
  const cornerDy = dy - cornerDist;
  const dist = Math.sqrt(cornerDx * cornerDx + cornerDy * cornerDy);
  if (dist <= radius - 0.5) return 1.0;
  if (dist >= radius + 0.5) return 0.0;
  return radius + 0.5 - dist; // Anti-alias edge
}

// Check distance to circle mask
function isInCircle(x, y, size) {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const r = (size - 1) / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (dist <= r - 0.5) return 1.0;
  if (dist >= r + 0.5) return 0.0;
  return r + 0.5 - dist;
}

const emblem = decodePNG('public/resiboss-emblem.png');
console.log('Loaded source emblem:', emblem.w, 'x', emblem.h);

const densities = [
  { name: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
];

densities.forEach(({ name, iconSize, fgSize }) => {
  const dir = path.join('android/app/src/main/res', name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Adaptive Foreground: 108dp canvas, safe area ~72%
  const fgBuf = Buffer.alloc(fgSize * fgSize * 4, 0);
  const fgScale = 0.72; // Safe zone fits nicely inside Android's adaptive circle/squircle
  const scaledSize = fgSize * fgScale;
  const fgOffset = (fgSize - scaledSize) / 2;

  for (let y = 0; y < fgSize; y++) {
    for (let x = 0; x < fgSize; x++) {
      const u = ((x - fgOffset) / scaledSize) * (emblem.w - 1);
      const v = ((y - fgOffset) / scaledSize) * (emblem.h - 1);
      if (u >= 0 && u < emblem.w && v >= 0 && v < emblem.h) {
        const c = sampleBilinear(emblem, u, v);
        const dIdx = (y * fgSize + x) * 4;
        fgBuf[dIdx] = c[0];
        fgBuf[dIdx+1] = c[1];
        fgBuf[dIdx+2] = c[2];
        fgBuf[dIdx+3] = c[3];
      }
    }
  }
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), encodePNG(fgSize, fgSize, fgBuf));

  // 2. Legacy Squircle Launcher (ic_launcher.png)
  const sqBuf = Buffer.alloc(iconSize * iconSize * 4, 0);
  const sqRadius = iconSize * 0.22; // Smooth iOS/Android squircle corner
  const emblemScale = 0.82;
  const emblemSize = iconSize * emblemScale;
  const emblemOffset = (iconSize - emblemSize) / 2;

  for (let y = 0; y < iconSize; y++) {
    for (let x = 0; x < iconSize; x++) {
      const mask = isInSquircle(x + 0.5, y + 0.5, iconSize, sqRadius);
      if (mask > 0) {
        const dIdx = (y * iconSize + x) * 4;
        // Dark background #040810
        sqBuf[dIdx] = 4;
        sqBuf[dIdx+1] = 8;
        sqBuf[dIdx+2] = 16;
        sqBuf[dIdx+3] = Math.round(mask * 255);

        // Overlay emblem
        const u = ((x - emblemOffset) / emblemSize) * (emblem.w - 1);
        const v = ((y - emblemOffset) / emblemSize) * (emblem.h - 1);
        if (u >= 0 && u < emblem.w && v >= 0 && v < emblem.h) {
          const c = sampleBilinear(emblem, u, v);
          c[3] = Math.round(c[3] * mask);
          blendPixel(sqBuf, dIdx, c);
        }
      }
    }
  }
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), encodePNG(iconSize, iconSize, sqBuf));

  // 3. Legacy Round Launcher (ic_launcher_round.png)
  const rdBuf = Buffer.alloc(iconSize * iconSize * 4, 0);
  for (let y = 0; y < iconSize; y++) {
    for (let x = 0; x < iconSize; x++) {
      const mask = isInCircle(x + 0.5, y + 0.5, iconSize);
      if (mask > 0) {
        const dIdx = (y * iconSize + x) * 4;
        rdBuf[dIdx] = 4;
        rdBuf[dIdx+1] = 8;
        rdBuf[dIdx+2] = 16;
        rdBuf[dIdx+3] = Math.round(mask * 255);

        const u = ((x - emblemOffset) / emblemSize) * (emblem.w - 1);
        const v = ((y - emblemOffset) / emblemSize) * (emblem.h - 1);
        if (u >= 0 && u < emblem.w && v >= 0 && v < emblem.h) {
          const c = sampleBilinear(emblem, u, v);
          c[3] = Math.round(c[3] * mask);
          blendPixel(rdBuf, dIdx, c);
        }
      }
    }
  }
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), encodePNG(iconSize, iconSize, rdBuf));

  console.log('Generated launcher icons for', name);
});

console.log('Done generating all Android icons!');
