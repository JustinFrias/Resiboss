/**
 * Resiboss Gemini AI OCR Module
 * Uses Google Gemini 1.5 Flash (vision) to extract structured data from receipt images.
 * Gemini Flash is FREE: 15 requests/minute, 1,500 requests/day on the free tier.
 * Get your key at: https://aistudio.google.com/app/apikey
 */

const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

/**
 * Gets the active Gemini API key from localStorage or Vite environment.
 * Allows mobile and web users to configure their own free Gemini key in settings.
 */
export function getActiveGeminiKey() {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('resiboss_gemini_api_key') || localStorage.getItem('gemini_api_key');
    if (userKey && userKey.trim().length > 10) return userKey.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Saves or clears the user's Gemini key in localStorage.
 */
export function saveGeminiKey(key) {
  if (typeof window !== 'undefined') {
    if (key && key.trim().length > 0) {
      localStorage.setItem('resiboss_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('resiboss_gemini_api_key');
      localStorage.removeItem('gemini_api_key');
    }
  }
}

/**
 * Validates a Gemini API key with a lightweight call.
 */
export async function testGeminiApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return { success: false, message: 'Invalid or empty API key.' };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey.trim()}`;
    const res = await fetch(url);
    if (res.ok) {
      return { success: true };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err?.error?.message || `API returned status ${res.status}` };
  } catch (e) {
    return { success: false, message: e.message || 'Network connection failed.' };
  }
}

/**
 * The structured prompt sent to Gemini.
 * Instructs it to return a strict JSON object — key to high accuracy.
 */
const RECEIPT_EXTRACTION_PROMPT = `You are an expert receipt data extraction system.
Analyze this receipt image and extract ALL information accurately.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "merchant": "Full merchant/store name as printed",
  "date": "YYYY-MM-DD format (best guess if unclear)",
  "time": "HH:MM AM/PM format or empty string",
  "tin": "TIN/Tax ID number exactly as printed, or empty string if not found",
  "invoiceNo": "Receipt/OR/Invoice number if present, or empty string",
  "category": "One of: Food, Groceries, Utilities, Travel, Healthcare, Technology, Hardware, Others",
  "paymentMethod": "Cash, Visa, MasterCard, GCash, Maya, Credit Card, Debit Card, or as printed",
  "currency": "PHP, USD, EUR, or best guess from context",
  "subtotal": null,
  "vat": null,
  "total": null,
  "discount": null,
  "items": [
    {
      "name": "Item description exactly as printed",
      "qty": 1,
      "price": 0.00,
      "total": 0.00
    }
  ]
}

Rules:
- Extract ALL line items visible. Do NOT skip any purchased items.
- Replace the null placeholders with actual numbers from the receipt.
- For amounts: remove currency symbols, use decimal point (not comma) for cents.
- If subtotal is not shown but total and VAT are known: subtotal = total - vat.
- If VAT is 12% (Philippine standard): subtotal = total / 1.12, vat = total - subtotal.
- The "tin" field is ONLY for Tax Identification Numbers. Receipt/Order numbers go in "invoiceNo".
- Items that are store addresses, phone numbers, loyalty points, or promo text are NOT line items.
- If some fields are truly absent, use null for numbers and empty string for text fields.
- Always return valid JSON even if data is missing.`;

/**
 * Converts a data URL to Gemini's inline image part format.
 */
function dataUrlToGeminiPart(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { inlineData: { mimeType: match[1], data: match[2] } };
  }
  // Already raw base64 without header — assume JPEG
  return { inlineData: { mimeType: 'image/jpeg', data: dataUrl } };
}

/**
 * Calls Gemini vision API with the receipt image, trying models in order of availability.
 * Returns parsed JSON object or null on failure.
 */
export async function extractWithGemini(imageDataUrl, apiKey) {
  if (!apiKey || !imageDataUrl) return null;

  const imagePart = dataUrlToGeminiPart(imageDataUrl);
  if (!imagePart) return null;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: RECEIPT_EXTRACTION_PROMPT },
          imagePart,
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,     // Very low — deterministic extraction, not creativity
      topK: 1,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`Gemini ${model} ${response.status}: ${errText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Strip markdown code fences if Gemini wrapped JSON in ```json ... ```
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleanJson = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

      try {
        return JSON.parse(cleanJson);
      } catch {
        console.warn(`[GeminiOCR] ${model} JSON parse failed. Raw:`, cleanJson.substring(0, 300));
        return null;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (lastError) {
    throw lastError;
  }
  return null;
}

/**
 * Validates and normalizes the raw Gemini response into the Resiboss receipt format.
 * Ensures math consistency and fills in fallbacks for missing fields.
 */
export function normalizeGeminiResult(raw, parseAmountFn) {
  if (!raw || typeof raw !== 'object') return null;

  // Parse amounts — handle both number and string values from Gemini
  const parseNum = (v) => {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') return parseAmountFn(v);
    return null;
  };

  let total    = parseNum(raw.total);
  let subtotal = parseNum(raw.subtotal);
  let vat      = parseNum(raw.vat);
  const currency = String(raw.currency || 'PHP').toUpperCase();
  const vatRate  = currency === 'EUR' ? 0.10 : currency === 'USD' ? 0.08 : 0.12; // PH default 12%

  // Enforce math consistency
  if (total && total > 0) {
    if (vat && vat > 0 && vat < total && !subtotal) {
      subtotal = +(total - vat).toFixed(2);
    } else if (subtotal && subtotal > 0 && subtotal < total && !vat) {
      vat = +(total - subtotal).toFixed(2);
    } else if ((!subtotal || subtotal <= 0) || (!vat || vat <= 0)) {
      subtotal = +(total / (1 + vatRate)).toFixed(2);
      vat      = +(total - subtotal).toFixed(2);
    }
  } else if (subtotal && subtotal > 0) {
    if (vat && vat > 0) {
      total = +(subtotal + vat).toFixed(2);
    } else {
      vat   = +(subtotal * vatRate).toFixed(2);
      total = +(subtotal + vat).toFixed(2);
    }
  }

  // Normalize line items — filter out noise
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((it) => it && typeof it.name === 'string' && it.name.trim().length > 1)
        .map((it) => {
          const qty   = Math.max(1, parseInt(it.qty, 10) || 1);
          const price = parseNum(it.price) || 0;
          const itTot = parseNum(it.total) || (price * qty) || 0;
          return {
            name:  it.name.trim(),
            qty,
            price: price || +(itTot / qty).toFixed(2),
            total: itTot,
          };
        })
        .filter((it) => it.total > 0 || it.price > 0)
    : [];

  // Merchant
  const merchant = String(raw.merchant || '').trim() || 'Scanned Merchant Store';

  // Date — enforce YYYY-MM-DD
  let date = String(raw.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = new Date().toISOString().split('T')[0];
  }

  // TIN — must be numeric-ish; if Gemini put an order number here, move it
  let tin = String(raw.tin || '').trim();
  const invoiceNo = String(raw.invoiceNo || '').trim();
  if (!tin || tin.length < 5 || !/\d/.test(tin)) {
    tin = invoiceNo ? `REF-${invoiceNo}` : '';
  }

  return {
    merchant,
    date,
    time:          String(raw.time || '12:00 PM').trim() || '12:00 PM',
    tin,
    category:      raw.category    || 'Others',
    paymentMethod: raw.paymentMethod || 'Cash',
    currency,
    subtotal:      subtotal || 0,
    vat:           vat      || 0,
    total:         total    || 0,
    discount:      parseNum(raw.discount) || null,
    items,
  };
}
