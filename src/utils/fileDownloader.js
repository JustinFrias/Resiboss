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
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Extract raw Base64 from data URL.
 */
function dataUrlToBase64(dataUrl) {
  if (!dataUrl) return '';
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : parts[0];
}

/**
 * Universal cross-platform file downloader.
 * - On Native Mobile (Capacitor Android / iOS):
 *   Writes file to Cache & Documents storage, then opens native Android Share / Save sheet.
 * - On Web / Desktop Browser:
 *   Triggers standard browser file download via Blob / Anchor.
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

      // Save to Cache so Android FileProvider can access and share/open it
      const cacheResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Also persist to Documents directory
      try {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (docErr) {
        console.warn('Could not write to Documents directory, cache copy available:', docErr);
      }

      // Open Android native Save / Share sheet
      try {
        await Share.share({
          title: filename,
          text: `Download / Save ${filename}`,
          url: cacheResult.uri,
          dialogTitle: `Save or Open ${filename}`,
        });
      } catch (shareErr) {
        // User cancelling share dialog is normal and shouldn't trigger an error
        if (shareErr.name !== 'AbortError' && !String(shareErr).includes('canceled') && !String(shareErr).includes('cancelled')) {
          console.warn('Native share dialog note:', shareErr);
        }
      }

      return { success: true, method: 'native', uri: cacheResult.uri, filename };
    } catch (err) {
      console.error('Capacitor native download error, attempting browser fallback:', err);
    }
  }

  // -------------------------------------------------------------
  // 2. BROWSER / WEB FALLBACK
  // -------------------------------------------------------------
  try {
    let downloadUrl;
    let shouldRevoke = false;

    if (isBase64 && typeof content === 'string' && content.startsWith('data:')) {
      downloadUrl = content;
    } else {
      const blob = new Blob([content], { type: mimeType });
      downloadUrl = URL.createObjectURL(blob);
      shouldRevoke = true;
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
        if (shouldRevoke) URL.revokeObjectURL(downloadUrl);
      } catch (e) {}
    }, 1500);

    return { success: true, method: 'browser', filename };
  } catch (browserErr) {
    console.error('Browser download error:', browserErr);
    return { success: false, error: browserErr };
  }
}

/**
 * Downloads a single receipt record as a detailed CSV spreadsheet.
 */
export async function downloadReceiptAsCsv(doc) {
  if (!doc) return false;

  const safeMerchant = (doc.merchant || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeId = (doc.id || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Receipt_${safeMerchant}_${safeId}.csv`;

  const csvRows = [
    'Field,Value',
    `"Receipt ID","${(doc.id || '').replace(/"/g, '""')}"`,
    `"Merchant / Store","${(doc.merchant || '').replace(/"/g, '""')}"`,
    `"Date","${doc.date || ''}"`,
    `"Time","${doc.time || '12:00 PM'}"`,
    `"TIN / OR#","${(doc.tin || '').replace(/"/g, '""')}"`,
    `"Category","${doc.category || 'Food'}"`,
    `"Payment Method","${doc.paymentMethod || 'Cash'}"`,
    `"Status","${doc.status || 'Verified'}"`,
    `"Subtotal (Net of VAT)","${((doc.subtotal || 0)).toFixed(2)}"`,
    `"VAT Amount (12%)","${((doc.vat || 0)).toFixed(2)}"`,
    `"Total Amount (PHP)","${((doc.total || 0)).toFixed(2)}"`,
    `"Confidence","${doc.confidence ? doc.confidence + '%' : '100%'}"`,
    '',
    'Item Name,Quantity,Unit Price,Total Price',
  ];

  if (Array.isArray(doc.items) && doc.items.length > 0) {
    doc.items.forEach((it) => {
      const name = (it.name || 'Item').replace(/"/g, '""');
      const qty = it.qty || 1;
      const unitPrice = ((it.price || it.total || 0)).toFixed(2);
      const itemTotal = ((it.total || (it.price ? it.price * qty : 0))).toFixed(2);
      csvRows.push(`"${name}",${qty},${unitPrice},${itemTotal}`);
    });
  } else {
    csvRows.push(`"${(doc.merchant || 'Purchase').replace(/"/g, '""')}",1,${((doc.total || 0)).toFixed(2)},${((doc.total || 0)).toFixed(2)}`);
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  return await downloadFile({
    content: csvContent,
    filename,
    mimeType: 'text/csv;charset=utf-8;',
  });
}

/**
 * Downloads a single receipt scanned photo if present.
 */
export async function downloadReceiptImage(doc) {
  if (!doc || !doc.imageUri) return false;

  const safeMerchant = (doc.merchant || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeId = (doc.id || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
  const isPng = doc.imageUri.includes('image/png');
  const ext = isPng ? 'png' : 'jpg';
  const filename = `Receipt_Photo_${safeMerchant}_${safeId}.${ext}`;

  return await downloadFile({
    content: doc.imageUri,
    filename,
    mimeType: isPng ? 'image/png' : 'image/jpeg',
    isBase64: true,
  });
}
