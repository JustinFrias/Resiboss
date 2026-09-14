/**
 * AWS Textract – AnalyzeExpense Client & Response Parser for Resiboss
 * Pure JavaScript with zero heavy dependencies (native Web Crypto SigV4).
 * Runs seamlessly on both Web and Capacitor Native Android.
 */

// Default AWS Region for Textract (ap-southeast-1 or us-east-1)
export const DEFAULT_AWS_REGION = 'ap-southeast-1';

/**
 * Retrieves the active AWS credentials from environment or storage.
 */
export function getActiveAwsCredentials() {
  const envAccessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
  const envSecretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';
  const envRegion = import.meta.env.VITE_AWS_REGION || DEFAULT_AWS_REGION;

  if (envAccessKey && envSecretKey) {
    return {
      accessKeyId: envAccessKey.trim(),
      secretAccessKey: envSecretKey.trim(),
      region: envRegion.trim(),
    };
  }

  if (typeof window !== 'undefined') {
    const savedAccessKey = localStorage.getItem('resiboss_aws_access_key_id') || '';
    const savedSecretKey = localStorage.getItem('resiboss_aws_secret_access_key') || '';
    const savedRegion = localStorage.getItem('resiboss_aws_region') || DEFAULT_AWS_REGION;
    if (savedAccessKey && savedSecretKey) {
      return {
        accessKeyId: savedAccessKey.trim(),
        secretAccessKey: savedSecretKey.trim(),
        region: savedRegion.trim(),
      };
    }
  }

  return {
    accessKeyId: '',
    secretAccessKey: '',
    region: envRegion,
  };
}

/**
 * Checks whether AWS Textract credentials have been configured.
 */
export function isAwsTextractConfigured() {
  const creds = getActiveAwsCredentials();
  return Boolean(
    creds.accessKeyId &&
    creds.secretAccessKey &&
    !creds.accessKeyId.includes('your-aws') &&
    !creds.secretAccessKey.includes('your-aws')
  );
}

// -----------------------------------------------------------------------------
// AWS Signature Version 4 Helper (Web Crypto API)
// -----------------------------------------------------------------------------

async function sha256Hex(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacRaw(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? new TextEncoder().encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
}

async function hmacHex(key, data) {
  const sigBuffer = await hmacRaw(key, data);
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  return sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sends a signed AnalyzeExpense request to AWS Textract.
 */
export async function callTextractAnalyzeExpense(base64ImageBytes, credentials) {
  const { accessKeyId, secretAccessKey, region } = credentials;
  const service = 'textract';
  const host = `textract.${region}.amazonaws.com`;
  const endpoint = `https://${host}/`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  const payload = JSON.stringify({
    Document: {
      Bytes: base64ImageBytes,
    },
  });

  const payloadHash = await sha256Hex(payload);

  const canonicalHeaders =
    `content-type:application/x-amz-json-1.1\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:Textract.AnalyzeExpense\n`;

  const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest =
    `POST\n` +
    `/\n` +
    `\n` +
    canonicalHeaders +
    `\n` +
    signedHeaders +
    `\n` +
    payloadHash;

  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n` +
    `${amzDate}\n` +
    `${credentialScope}\n` +
    canonicalRequestHash;

  // Derive signing key
  const kDate = await hmacRaw(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmacRaw(kDate, region);
  const kService = await hmacRaw(kRegion, service);
  const kSigning = await hmacRaw(kService, 'aws4_request');

  const signature = await hmacHex(kSigning, stringToSign);

  const authorizationHeader =
    `AWS4-HMAC-SHA256 ` +
    `Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Textract.AnalyzeExpense',
      'X-Amz-Date': amzDate,
      Authorization: authorizationHeader,
    },
    body: payload,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    let parsedErr = {};
    try {
      parsedErr = JSON.parse(errText);
    } catch (_) {}
    const msg = parsedErr?.message || parsedErr?.Message || `AWS Textract returned HTTP ${response.status}`;
    throw new Error(msg);
  }

  return await response.json();
}

/**
 * Normalizes AWS Textract AnalyzeExpense response into Resiboss Receipt model.
 */
export function normalizeTextractExpense(data) {
  if (!data?.ExpenseDocuments || !Array.isArray(data.ExpenseDocuments) || data.ExpenseDocuments.length === 0) {
    return null;
  }

  const doc = data.ExpenseDocuments[0];
  const summaryFields = doc.SummaryFields || [];
  const lineItemGroups = doc.LineItemGroups || [];

  const getField = (typeNames) => {
    const types = Array.isArray(typeNames) ? typeNames : [typeNames];
    for (const name of types) {
      const found = summaryFields.find(
        (f) => (f.Type?.Text || '').toUpperCase() === name.toUpperCase()
      );
      if (found?.ValueDetection?.Text) {
        return found.ValueDetection.Text.trim();
      }
    }
    return '';
  };

  const parseNum = (val) => {
    if (!val) return 0;
    const clean = String(val).replace(/[^\d.-]/g, '');
    const n = parseFloat(clean);
    return Number.isFinite(n) ? +(n.toFixed(2)) : 0;
  };

  // Vendor / Merchant Name
  const merchant = getField(['VENDOR_NAME', 'NAME', 'RECEIPT_NAME']) || 'Scanned Merchant Store';

  // Dates
  const rawDate = getField(['INVOICE_RECEIPT_DATE', 'DATE', 'TRANSACTION_DATE']);
  let date = new Date().toISOString().split('T')[0];
  if (rawDate) {
    const parsedD = new Date(rawDate);
    if (!isNaN(parsedD.getTime())) {
      date = parsedD.toISOString().split('T')[0];
    }
  }

  // Financial Amounts
  const total = parseNum(getField(['TOTAL', 'AMOUNT_PAID', 'BALANCE_DUE']));
  let subtotal = parseNum(getField(['SUBTOTAL', 'NET_AMOUNT', 'BEFORE_TAX']));
  let vat = parseNum(getField(['TAX', 'TAX_PAYER_ID_TAX', 'VAT']));

  if (total > 0 && subtotal === 0 && vat === 0) {
    subtotal = +(total / 1.12).toFixed(2);
    vat = +(total - subtotal).toFixed(2);
  } else if (total > 0 && subtotal > 0 && vat === 0) {
    vat = +(total - subtotal).toFixed(2);
  }

  // TIN / Tax ID
  const tin = getField(['TAX_PAYER_ID', 'VENDOR_VAT_NUMBER', 'RECEIPT_NUMBER', 'INVOICE_RECEIPT_ID']) || '';

  // Payment Method
  const paymentMethod = getField(['PAYMENT_METHOD', 'CARD_TYPE']) || 'Cash';

  // Items extraction from LineItemGroups
  const items = [];
  lineItemGroups.forEach((group) => {
    const lineItems = group.LineItems || [];
    lineItems.forEach((li) => {
      const fields = li.LineItemExpenseFields || [];
      const getItemField = (typeNames) => {
        const types = Array.isArray(typeNames) ? typeNames : [typeNames];
        for (const name of types) {
          const found = fields.find(
            (f) => (f.Type?.Text || '').toUpperCase() === name.toUpperCase()
          );
          if (found?.ValueDetection?.Text) return found.ValueDetection.Text.trim();
        }
        return '';
      };

      const desc = getItemField(['ITEM', 'EXPENSE_ROW', 'NAME', 'DESCRIPTION']);
      const priceStr = getItemField(['PRICE', 'TOTAL', 'AMOUNT']);
      const qtyStr = getItemField(['QUANTITY', 'QTY']);
      const unitPriceStr = getItemField(['UNIT_PRICE']);

      if (desc || priceStr) {
        const itemAmount = parseNum(priceStr);
        const qty = parseInt(qtyStr, 10) || 1;
        const unitPrice = parseNum(unitPriceStr) || (qty > 0 && itemAmount > 0 ? +(itemAmount / qty).toFixed(2) : itemAmount);

        items.push({
          name: desc || 'Item',
          description: desc || 'Item',
          qty: qty,
          quantity: qty,
          price: unitPrice,
          unitPrice: unitPrice,
          total: itemAmount || +(unitPrice * qty).toFixed(2),
          amount: itemAmount || +(unitPrice * qty).toFixed(2),
        });
      }
    });
  });

  return {
    merchant,
    date,
    tin,
    paymentMethod,
    subtotal,
    vat,
    total,
    items,
    confidence: 99,
    currency: 'PHP',
    ocrEngine: 'textract',
  };
}

/**
 * Main function: extracts receipt data using AWS Textract AnalyzeExpense.
 */
export async function extractWithTextract(imageUri, credentials) {
  if (!imageUri) return null;

  // Clean base64 image bytes
  let base64Bytes = imageUri;
  if (imageUri.includes('base64,')) {
    base64Bytes = imageUri.split('base64,')[1];
  }

  const rawResult = await callTextractAnalyzeExpense(base64Bytes, credentials);
  return normalizeTextractExpense(rawResult);
}
