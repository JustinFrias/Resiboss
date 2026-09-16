/**
 * Resiboss Google ML Kit Offline OCR Module
 * Provides zero-latency on-device text recognition on Android and iOS devices
 * without requiring an internet connection or external API key.
 *
 * Enhanced with:
 * 1. Image contrast/brightness boost preprocessing to cut through folds and faint thermal ink.
 * 2. Spatial row reconstruction using bounding boxes to correctly align two-column receipts
 *    (e.g., "2 HAMBURGER" on left column and "1.78" on right column joined on the same line).
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { TextRecognition, Script } from '@capacitor-mlkit/text-recognition';

/**
 * Checks if ML Kit on-device OCR is available on the current device.
 * True only when running inside the native Android/iOS Capacitor wrapper.
 */
export function isMlKitAvailable() {
  return Capacitor.isNativePlatform();
}

/**
 * Preprocesses an image before passing to ML Kit:
 * - Rescales if very large (caps at 2200px to maintain maximum character edge sharpness while keeping memory footprint low).
 * - Applies a balanced contrast & brightness boost via HTML5 Canvas filter to cut through
 *   receipt creases, shadow folds, and faint thermal printer printouts.
 */
export const preprocessForMlKit = (imageUri) => {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !imageUri) {
    return Promise.resolve(imageUri);
  }

  return new Promise((resolve) => {
    const safetyTimer = setTimeout(() => resolve(imageUri), 2500);

    const img = new Image();
    if (typeof imageUri === 'string' && !imageUri.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      clearTimeout(safetyTimer);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const MAX = 2000;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Enhance contrast and brightness to make faint thermal dots and creased columns readable
        ctx.filter = 'contrast(130%) brightness(105%)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        console.warn('[MLKitOCR] Canvas preprocessing warning, using original image:', err);
        resolve(imageUri);
      }
    };

    img.onerror = () => {
      clearTimeout(safetyTimer);
      resolve(imageUri);
    };
    img.src = imageUri;
  });
};

/**
 * Reconstructs coherent visual lines of text from ML Kit's hierarchical bounding box result.
 * Solves the two-column receipt problem where ML Kit separates the item-name column and the price column
 * into different blocks or lines.
 *
 * Algorithm:
 * 1. Collects text units (lines or elements) with spatial coordinates.
 * 2. Groups units into rows based on overlapping / similar Y-coordinate ranges (with tolerance for slant/creases).
 * 3. Within each reconstructed row, sorts units by X-coordinate (left-to-right).
 * 4. Returns coherent newline-separated text strings ("ITEM NAME ... PRICE").
 */
export function reconstructRowsFromMlKit(result) {
  if (!result) return '';
  if (typeof result === 'string') return result.trim();

  // If blocks are not provided or empty, fallback to raw text
  if (!result.blocks || !Array.isArray(result.blocks) || result.blocks.length === 0) {
    return (result.text || '').trim();
  }

  const rawUnits = [];

  for (const block of result.blocks) {
    const lines = Array.isArray(block.lines) && block.lines.length > 0 ? block.lines : [block];
    for (const line of lines) {
      if (!line || !line.text || !line.text.trim()) continue;

      let left, top, right, bottom;

      // 1. Check line.boundingBox
      if (line.boundingBox) {
        left = line.boundingBox.left;
        top = line.boundingBox.top;
        right = line.boundingBox.right;
        bottom = line.boundingBox.bottom;
      }

      // 2. Fallback to line.cornerPoints
      if ((top === undefined || bottom === undefined || left === undefined || right === undefined) &&
          Array.isArray(line.cornerPoints) && line.cornerPoints.length > 0) {
        const xs = line.cornerPoints.map((p) => p.x);
        const ys = line.cornerPoints.map((p) => p.y);
        left = Math.min(...xs);
        right = Math.max(...xs);
        top = Math.min(...ys);
        bottom = Math.max(...ys);
      }

      // 3. Fallback to elements inside line
      if ((top === undefined || bottom === undefined || left === undefined || right === undefined) &&
          Array.isArray(line.elements) && line.elements.length > 0) {
        const validElements = line.elements.filter((e) => e?.boundingBox);
        if (validElements.length > 0) {
          left = Math.min(...validElements.map((e) => e.boundingBox.left));
          right = Math.max(...validElements.map((e) => e.boundingBox.right));
          top = Math.min(...validElements.map((e) => e.boundingBox.top));
          bottom = Math.max(...validElements.map((e) => e.boundingBox.bottom));
        }
      }

      if (top !== undefined && bottom !== undefined && left !== undefined && right !== undefined) {
        const height = Math.max(1, bottom - top);
        const centerY = (top + bottom) / 2;
        rawUnits.push({
          text: line.text.trim(),
          left,
          top,
          right,
          bottom,
          height,
          centerY,
        });
      } else {
        rawUnits.push({
          text: line.text.trim(),
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          height: 0,
          centerY: 0,
          noCoords: true,
        });
      }
    }
  }

  const unitsWithCoords = rawUnits.filter((u) => !u.noCoords);
  const unitsWithoutCoords = rawUnits.filter((u) => u.noCoords);

  // If no units had coordinates, fallback to default text
  if (unitsWithCoords.length === 0) {
    return (result.text || '').trim();
  }

  // Sort units primarily by vertical position (centerY)
  unitsWithCoords.sort((a, b) => a.centerY - b.centerY);

  // Determine adaptive vertical tolerance based on median line height
  const sortedHeights = [...unitsWithCoords.map((u) => u.height)].sort((a, b) => a - b);
  const medianHeight = sortedHeights[Math.floor(sortedHeights.length / 2)] || 20;
  const maxCenterDiff = medianHeight * 0.65;

  const rows = [];

  for (const unit of unitsWithCoords) {
    let bestRow = null;
    let bestOverlap = 0;
    let minDistance = Infinity;

    for (const row of rows) {
      const verticalOverlap = Math.min(row.maxBottom, unit.bottom) - Math.max(row.minTop, unit.top);
      const minH = Math.min(row.avgHeight, unit.height);
      const overlapRatio = minH > 0 ? verticalOverlap / minH : 0;
      const centerDiff = Math.abs(row.avgCenterY - unit.centerY);

      // Match if vertical overlap is significant (> 35%) OR center vertical distance is within tolerance
      if (overlapRatio > 0.35 || centerDiff <= maxCenterDiff) {
        if (overlapRatio > bestOverlap || (overlapRatio === bestOverlap && centerDiff < minDistance)) {
          bestOverlap = overlapRatio;
          minDistance = centerDiff;
          bestRow = row;
        }
      }
    }

    if (bestRow) {
      bestRow.units.push(unit);
      bestRow.minTop = Math.min(bestRow.minTop, unit.top);
      bestRow.maxBottom = Math.max(bestRow.maxBottom, unit.bottom);
      bestRow.avgCenterY = (bestRow.avgCenterY * (bestRow.units.length - 1) + unit.centerY) / bestRow.units.length;
      bestRow.avgHeight = (bestRow.avgHeight * (bestRow.units.length - 1) + unit.height) / bestRow.units.length;
    } else {
      rows.push({
        units: [unit],
        minTop: unit.top,
        maxBottom: unit.bottom,
        avgCenterY: unit.centerY,
        avgHeight: unit.height,
      });
    }
  }

  // Sort rows top-to-bottom
  rows.sort((a, b) => a.avgCenterY - b.avgCenterY);

  // Inside each row, sort units left-to-right (by left X-coordinate) and join into a single coherent line
  const reconstructedLines = rows.map((row) => {
    row.units.sort((a, b) => a.left - b.left);
    return row.units.map((u) => u.text).join(' ');
  });

  // Append any lines that had no coordinates at the end
  if (unitsWithoutCoords.length > 0) {
    unitsWithoutCoords.forEach((u) => reconstructedLines.push(u.text));
  }

  return reconstructedLines.join('\n').trim();
}

/**
 * Executes on-device Google ML Kit text recognition on the provided image.
 *
 * @param {string} imageUri - Base64 data URL, file path, or content URI.
 * @returns {Promise<string | null>} Row-reconstructed recognized text string, or null if unavailable / error.
 */
export async function extractWithMlKit(imageUri) {
  // Guard: return null if not native platform (web) or empty input
  if (!Capacitor.isNativePlatform() || !imageUri) {
    return null;
  }

  let tempFilePath = null;

  try {
    // Preprocess image with canvas contrast/brightness enhancement
    let processedUri = imageUri;
    try {
      processedUri = await preprocessForMlKit(imageUri);
    } catch (prepErr) {
      console.warn('[MLKitOCR] Preprocessing error, continuing with original:', prepErr);
    }

    let localPath = processedUri;

    // If imageUri is a base64 data URL, write to temporary cache so native ML Kit can read file
    if (typeof processedUri === 'string' && processedUri.startsWith('data:')) {
      const match = processedUri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      const ext = match ? match[1] : 'jpg';
      const base64Data = match ? match[2] : processedUri.replace(/^data:[^;]+;base64,/, '');

      const fileName = `resiboss_ocr_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
      tempFilePath = fileName;

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      const uriResult = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      localPath = uriResult.uri;
    }

    const options = {
      path: localPath,
      script: Script?.Latin || 'LATIN',
    };

    // Run recognition with a 10s watchdog timeout so it can never freeze
    const recognitionPromise = TextRecognition.processImage(options);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('ML Kit recognition timeout')), 10000)
    );

    const result = await Promise.race([recognitionPromise, timeoutPromise]);

    // Reconstruct spatial rows from structured result (bounding boxes)
    const reconstructedText = reconstructRowsFromMlKit(result);

    // Return row-reconstructed text as a string (flows into receiptOcrParser.js)
    if (reconstructedText && reconstructedText.length > 0) {
      return reconstructedText;
    }

    const rawText = (typeof result === 'string' ? result : result?.text) || '';
    return rawText.trim() || null;
  } catch (error) {
    console.warn('[MLKitOCR] Native text recognition failed, returning null:', error?.message || error);
    return null;
  } finally {
    // Clean up temporary cache file if one was written
    if (tempFilePath) {
      try {
        await Filesystem.deleteFile({
          path: tempFilePath,
          directory: Directory.Cache,
        });
      } catch (_) {}
    }
  }
}
