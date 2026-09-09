import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Listeners for download completion notifications (Browser-style download cards)
const downloadListeners = new Set();

export function addDownloadListener(listener) {
  downloadListeners.add(listener);
  return () => downloadListeners.delete(listener);
}

function notifyDownloadCompleted(payload) {
  downloadListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {
      console.warn('Download listener error:', e);
    }
  });
}

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
 * Opens a downloaded file directly on the user's device.
 * - On Native Mobile (Capacitor Android / iOS): Uses Android system intent to open in Excel, Sheets, or viewer
 * - On Web / Mobile Web: Opens blob in a new tab / viewer
 */
export async function openDownloadedFile({ filename, uri, blobUrl, content, mimeType, isBase64 }) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative && uri) {
    try {
      await Share.share({
        title: filename,
        text: `Open ${filename}`,
        url: uri,
        dialogTitle: `Open ${filename}`,
      });
      return { success: true, method: 'native-open' };
    } catch (shareErr) {
      if (shareErr.name !== 'AbortError') {
        console.warn('Native open via Share failed:', shareErr);
      }
    }
  }

  // Web fallback: open blob or content URL
  try {
    let targetUrl = blobUrl;
    if (!targetUrl) {
      if (isBase64 && content?.startsWith('data:')) {
        targetUrl = content;
      } else if (content) {
        const blob = new Blob([content], { type: mimeType || 'text/csv;charset=utf-8;' });
        targetUrl = URL.createObjectURL(blob);
      }
    }

    if (targetUrl) {
      const newTab = window.open(targetUrl, '_blank');
      if (!newTab) {
        const a = document.createElement('a');
        a.href = targetUrl;
        a.target = '_blank';
        a.click();
      }
      return { success: true, method: 'browser-open' };
    }
  } catch (err) {
    console.error('Cannot open file preview:', err);
  }

  return { success: false };
}

/**
 * Universal cross-platform downloader.
 * Supports:
 * 1. Capacitor Native Android / iOS (saves to Documents & Cache, triggers notification banner & open action)
 * 2. Mobile Browser (Native download to Downloads folder)
 * 3. Desktop Browser (Standard download with Blob ObjectURL)
 *
 * @param {Object} options
 * @param {string} options.content - Raw text (CSV, JSON, XML, etc.) or DataURL
 * @param {string} options.filename - Output filename (e.g. "Resiboss_csv_Journal_2026-09-09.csv")
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

      // Save to Cache so Android FileProvider can share / open it securely
      const cacheResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Also persist a copy into the device's Documents storage
      let permanentUri = cacheResult.uri;
      try {
        const docResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        permanentUri = docResult.uri || permanentUri;
      } catch (err) {
        console.warn('Could not write to Documents directory, cache copy available:', err);
      }

      // Trigger the browser-style download notification card with "Open file"
      notifyDownloadCompleted({
        id: `DL-${Date.now()}`,
        filename,
        uri: cacheResult.uri,
        mimeType,
        content,
        isBase64,
        timestamp: Date.now(),
      });

      return { success: true, method: 'capacitor-native', uri: cacheResult.uri, filename };
    } catch (err) {
      console.error('Capacitor native download error, attempting browser fallback:', err);
    }
  }

  // -------------------------------------------------------------
  // 2. BROWSER / MOBILE WEB (Direct Download to Device Downloads)
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

  // Trigger the browser-style download notification card with "Open file"
  notifyDownloadCompleted({
    id: `DL-${Date.now()}`,
    filename,
    blobUrl: downloadUrl,
    mimeType,
    content,
    isBase64,
    timestamp: Date.now(),
  });

  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch (e) {}
  }, 1000);

  return { success: true, method: 'browser-anchor', filename, blobUrl: downloadUrl };
}
