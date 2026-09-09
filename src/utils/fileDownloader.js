import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * UTF-8 safe text to Base64 encoder.
 */
function textToBase64(str) {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Convert Data URL (e.g. data:image/jpeg;base64,...) to raw Base64 string
 */
function dataUrlToBase64(dataUrl) {
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : parts[0];
}

/**
 * Universal cross-platform downloader.
 * Supports:
 * 1. Capacitor Native Android / iOS (saves to Documents & triggers Android Share / Save to Downloads sheet)
 * 2. Mobile Browser (Web Share API with file attachment)
 * 3. Desktop Browser (<a download> with Blob ObjectURL)
 *
 * @param {Object} options
 * @param {string} options.content - Raw text (CSV, JSON, XML, etc.) or DataURL
 * @param {string} options.filename - Output filename (e.g. "Resiboss_Purchases_2026.csv")
 * @param {string} [options.mimeType='text/csv;charset=utf-8;'] - MIME type
 * @param {boolean} [options.isBase64=false] - If content is already base64 or DataURL
 */
export async function downloadFile({
  content,
  filename,
  mimeType = 'text/csv;charset=utf-8;',
  isBase64 = false,
}) {
  const isNative = Capacitor.isNativePlatform();

  // -------------------------------------------------------------
  // 1. CAPACITOR NATIVE ANDROID / IOS
  // -------------------------------------------------------------
  if (isNative) {
    try {
      const base64Data = isBase64 ? dataUrlToBase64(content) : textToBase64(content);

      // Save to Cache so Android FileProvider can share it securely
      const cacheResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Also persist a copy into the device's permanent Documents storage
      try {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (err) {
        console.warn('Could not write to Documents directory, cached copy available:', err);
      }

      // Trigger Android System Share Sheet (Save to Downloads, Save to Drive, Files, etc.)
      await Share.share({
        title: filename,
        text: `Resiboss Receipt Export: ${filename}`,
        url: cacheResult.uri,
        dialogTitle: `Save or Share ${filename}`,
      });

      return { success: true, method: 'capacitor-native', uri: cacheResult.uri };
    } catch (err) {
      console.error('Capacitor native download error, attempting browser fallback:', err);
    }
  }

  // -------------------------------------------------------------
  // 2. MOBILE BROWSER (Web Share API with file attachment)
  // -------------------------------------------------------------
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
  if (isMobile && typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      let blob;
      if (isBase64) {
        const raw = dataUrlToBase64(content);
        const byteCharacters = atob(raw);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
      } else {
        blob = new Blob([content], { type: mimeType });
      }

      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: `Resiboss Export: ${filename}`,
        });
        return { success: true, method: 'web-share' };
      }
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') {
        return { success: true, method: 'cancelled' };
      }
      console.warn('Web Share failed, proceeding with anchor download:', shareErr);
    }
  }

  // -------------------------------------------------------------
  // 3. DESKTOP BROWSER / STANDARD FALLBACK (<a download>)
  // -------------------------------------------------------------
  let downloadUrl;
  let blobToRevoke = null;

  if (isBase64 && content.startsWith('data:')) {
    downloadUrl = content;
  } else {
    const blob = new Blob([content], { type: mimeType });
    downloadUrl = URL.createObjectURL(blob);
    blobToRevoke = downloadUrl;
  }

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    try {
      document.body.removeChild(link);
      if (blobToRevoke) {
        URL.revokeObjectURL(blobToRevoke);
      }
    } catch (e) {}
  }, 1000);

  return { success: true, method: 'browser-anchor' };
}
