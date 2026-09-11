import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as XLSX from 'xlsx';

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
 * Chunk-safe Uint8Array → Base64 encoder.
 * btoa(String.fromCharCode(...array)) throws on large files in Capacitor WebView
 * because spreading a big Uint8Array overflows the stack. This processes in 8KB chunks.
 */
function uint8ArrayToBase64(bytes) {
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
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
 * Convert Base64 string to a binary Blob for web download.
 */
function base64ToBlob(base64Data, contentType) {
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const byteCharacters = atob(cleanBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Detect the best MIME type for the given filename/mimeType.
 * Forces CSV/XLSX → Excel-compatible MIME so Android opens it with Sheets / Excel.
 */
function getShareMime(filename, mimeType) {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return mimeType || 'application/octet-stream';
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

      // 1. Always write to Directory.Cache FIRST.
      // Cache directory requires NO runtime permissions on any Android (up to API 36+) or iOS,
      // and is directly configured in FileProvider (internal_cache).
      const cacheResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Get full file:// URI for FileProvider
      let shareUri = cacheResult?.uri;
      if (!shareUri || !shareUri.startsWith('file:')) {
        try {
          const uriRes = await Filesystem.getUri({
            directory: Directory.Cache,
            path: filename,
          });
          shareUri = uriRes?.uri || shareUri;
        } catch (uErr) {
          console.warn('getUri Cache note:', uErr);
        }
      }

      // 2. Also try writing a persistent copy to Directory.Documents
      // so the file remains saved in the user's Documents folder.
      try {
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (docErr) {
        console.warn('Optional Documents folder write skipped:', docErr);
      }

      if (!shareUri) {
        throw new Error('Could not write file to device storage.');
      }

      // 3. Open native Android / iOS Share and Save dialog
      // In @capacitor/share v4.1+, only provide the `files` array with the file:// URI.
      // Do NOT pass `url` alongside `files` because Android SharePlugin processes both,
      // creating duplicate URIs that break the Intent chooser.
      try {
        await Share.share({
          title: filename,
          files: [shareUri],
          dialogTitle: `Download / Save ${filename}`,
        });
      } catch (shareErr) {
        if (
          shareErr?.name !== 'AbortError' &&
          !String(shareErr).includes('canceled') &&
          !String(shareErr).includes('cancelled') &&
          !String(shareErr).includes('dismiss')
        ) {
          console.warn('Native share note:', shareErr);
        }
      }

      // Generate blob URL for backup direct-tap download
      let backupBlobUrl = null;
      try {
        const blob = isBase64 ? base64ToBlob(content, mimeType) : new Blob([content], { type: mimeType });
        backupBlobUrl = URL.createObjectURL(blob);
      } catch (bErr) {}

      return { success: true, method: 'native', uri: shareUri, downloadUrl: backupBlobUrl, filename };
    } catch (err) {
      console.error('Capacitor native download error, attempting browser fallback:', err);
    }
  }

  // -------------------------------------------------------------
  // 2. BROWSER / WEB FALLBACK (Mobile Browser & Desktop)
  // -------------------------------------------------------------
  try {
    const blob = isBase64 ? base64ToBlob(content, mimeType) : new Blob([content], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);

    // Try Web Share API with files if on mobile browser (Chrome Android / Safari iOS)
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        const testFile = new File([blob], filename, { type: mimeType });
        if (navigator.canShare({ files: [testFile] })) {
          await navigator.share({
            files: [testFile],
            title: filename,
          });
          return { success: true, method: 'web-share', downloadUrl, filename };
        }
      } catch (wsErr) {
        if (wsErr?.name === 'AbortError') {
          return { success: true, method: 'web-share-dismissed', downloadUrl, filename };
        }
        console.warn('Web share note, proceeding with anchor download:', wsErr);
      }
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
      } catch (e) {}
    }, 2000);

    return { success: true, method: 'browser', downloadUrl, filename };
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

/**
 * Downloads a collection of receipts as a professional Microsoft Excel (.xlsx) workbook.
 * Creates itemized sheets, VAT tax breakdown, and purchases ledger.
 */
export async function downloadReceiptsExcel(documents = [], customFilename = '') {
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error('No receipt documents provided for Excel export.');
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = customFilename || `Resiboss_Expense_Journal_${timestamp}.xlsx`;

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Purchases & Expenses Journal
  // -------------------------------------------------------------
  const journalHeaders = [
    'No.',
    'Taxable Month',
    'Date',
    'Receipt ID',
    'Supplier / Merchant',
    'TIN / Reference',
    'Category',
    'Payment Method',
    'Status',
    'Vatable Purchases',
    'Input Tax (12% VAT)',
    'Total Amount',
  ];

  let totalVatable = 0;
  let totalVat = 0;
  let grandTotal = 0;

  const journalRows = documents.map((doc, idx) => {
    const tot = Number(doc.total) || 0;
    const sub = Number(doc.subtotal) || +(tot / 1.12).toFixed(2);
    const vat = Number(doc.vat) || +(tot - sub).toFixed(2);

    totalVatable += sub;
    totalVat += vat;
    grandTotal += tot;

    const dateObj = doc.date ? new Date(doc.date) : new Date();
    const taxMonth = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Current';

    return [
      idx + 1,
      taxMonth,
      doc.date || '',
      doc.id || `REC-${idx + 1}`,
      doc.merchant || 'Store',
      doc.tin || 'N/A',
      doc.category || 'General',
      doc.paymentMethod || 'Cash',
      doc.status || 'Verified',
      +sub.toFixed(2),
      +vat.toFixed(2),
      +tot.toFixed(2),
    ];
  });

  // Summary row
  journalRows.push([
    '',
    '',
    '',
    '',
    'TOTALS',
    '',
    '',
    '',
    '',
    +totalVatable.toFixed(2),
    +totalVat.toFixed(2),
    +grandTotal.toFixed(2),
  ]);

  const wsJournal = XLSX.utils.aoa_to_sheet([journalHeaders, ...journalRows]);
  wsJournal['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsJournal, 'Purchases Journal');

  // -------------------------------------------------------------
  // Sheet 2: Itemized Line Items Breakdown
  // -------------------------------------------------------------
  const itemHeaders = [
    'Receipt ID',
    'Date',
    'Merchant',
    'Category',
    'Item Description',
    'Qty',
    'Unit Price',
    'Line Total',
  ];

  const itemRows = [];
  documents.forEach((doc) => {
    if (Array.isArray(doc.items) && doc.items.length > 0) {
      doc.items.forEach((it) => {
        const qty = Number(it.qty) || 1;
        const price = Number(it.price) || 0;
        const total = Number(it.total) || price * qty;
        itemRows.push([
          doc.id || '',
          doc.date || '',
          doc.merchant || '',
          doc.category || '',
          it.name || 'Item',
          qty,
          +price.toFixed(2),
          +total.toFixed(2),
        ]);
      });
    } else {
      const tot = Number(doc.total) || 0;
      itemRows.push([
        doc.id || '',
        doc.date || '',
        doc.merchant || '',
        doc.category || '',
        doc.merchant || 'General Purchase',
        1,
        +tot.toFixed(2),
        +tot.toFixed(2),
      ]);
    }
  });

  const wsItems = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
  wsItems['!cols'] = [
    { wch: 16 },
    { wch: 12 },
    { wch: 26 },
    { wch: 14 },
    { wch: 32 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Itemized Breakdown');

  // Generate Excel workbook array
  const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const excelBlob = new Blob([xlsxArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // 1. IMMEDIATE ZERO-WAIT SYNCHRONOUS BROWSER TRIGGER
  // Triggered in the exact same call frame as user click — guarantees active transient
  // user activation so mobile Chrome, mobile Safari, and WebViews cannot block it.
  const directDownloadUrl = triggerDirectBlobDownload(excelBlob, filename);

  const isNative = Capacitor.isNativePlatform();
  if (isNative) {
    const b64 = uint8ArrayToBase64(new Uint8Array(xlsxArray));
    const nativeRes = await downloadFile({
      content: b64,
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      isBase64: true,
    });
    return {
      ...nativeRes,
      downloadUrl: directDownloadUrl || nativeRes?.downloadUrl,
      filename,
    };
  }

  return {
    success: true,
    method: 'browser-direct',
    downloadUrl: directDownloadUrl,
    filename,
  };
}

/**
 * Triggers a direct browser download synchronously within the active user gesture frame.
 * Appends to DOM, dispatches a trusted MouseEvent, and keeps the ObjectURL alive.
 */
export function triggerDirectBlobDownload(blob, filename) {
  if (typeof window === 'undefined') return null;

  try {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    link.setAttribute('rel', 'noopener');
    link.style.position = 'fixed';
    link.style.top = '-9999px';
    link.style.left = '-9999px';
    link.style.opacity = '0';
    document.body.appendChild(link);

    // Try modern MouseEvent dispatch, fall back to link.click()
    try {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      link.dispatchEvent(clickEvent);
    } catch (e) {
      link.click();
    }

    // Keep ObjectURL alive for 60s so mobile browser transfer finishes
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } catch (e) {}
    }, 60000);

    return downloadUrl;
  } catch (err) {
    console.error('triggerDirectBlobDownload error:', err);
    return null;
  }
}

/**
 * Downloads a single receipt record as a clean Microsoft Excel (.xlsx) file.
 */
export async function downloadReceiptAsExcel(doc) {
  if (!doc) return false;
  const safeMerchant = (doc.merchant || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeId = (doc.id || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Receipt_${safeMerchant}_${safeId}.xlsx`;
  return await downloadReceiptsExcel([doc], filename);
}

