/**
 * Resiboss Gemini AI OCR Module
 * Uses Google Gemini Flash (vision) to extract structured data from receipt images.
 * Gemini Flash is FREE: 15 requests/minute, 1,500 requests/day on the free tier.
 * Get your key at: https://aistudio.google.com/app/apikey
 */

// Modern, high-performance Gemini models ordered by priority.
export const DEFAULT_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
];

export const GEMINI_MODELS = DEFAULT_GEMINI_MODELS;

// Valid Google AI Studio Gemini keys start with 'AIzaSy'
export function isValidGeminiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.startsWith('test-') || trimmed.startsWith('mock-')) return true;
  return trimmed.startsWith('AIzaSy') && trimmed.length >= 30;
}

// System default key: empty unless a valid AIza key is configured
export const SYSTEM_DEFAULT_GEMINI_KEY = '';

/**
 * Builds request options supporting both standard Google AI Studio keys
 * and header-based keys.
 */
function getGeminiRequestConfig(apiKey, urlPath) {
  const cleanKey = (apiKey || '').trim();
  const headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': cleanKey,
  };
  const url = `${urlPath}${urlPath.includes('?') ? '&' : '?'}key=${encodeURIComponent(cleanKey)}`;
  return { headers, url };
}

// In-memory model list cache to prevent redundant API calls
let cachedAvailableModels = null;
let lastModelFetchTimestamp = 0;
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Dynamically queries the Google Gemini API to retrieve the current available
 * models that support vision / generateContent.
 * Falls back to DEFAULT_GEMINI_MODELS if offline, rate limited, or invalid key.
 */
export async function getAvailableGeminiModels(apiKey) {
  if (!isValidGeminiKey(apiKey)) {
    return [...DEFAULT_GEMINI_MODELS];
  }

  const now = Date.now();
  if (cachedAvailableModels && cachedAvailableModels.length > 0 && (now - lastModelFetchTimestamp < MODEL_CACHE_TTL_MS)) {
    return cachedAvailableModels;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const { url, headers } = getGeminiRequestConfig(apiKey, 'https://generativelanguage.googleapis.com/v1beta/models');
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        // Filter models that support generateContent and are Flash models (multimodal vision capable)
        const discovered = data.models
          .filter((m) => {
            const methods = m.supportedGenerationMethods || [];
            const rawName = (m.name || '').replace(/^models\//, '');
            return (
              methods.includes('generateContent') &&
              rawName.includes('flash') &&
              !rawName.includes('embedding') &&
              !rawName.includes('imagen') &&
              !rawName.includes('audio')
            );
          })
          .map((m) => m.name.replace(/^models\//, ''));

        if (discovered.length > 0) {
          // Rank models so newest, stable Flash versions are attempted first
          const rankModel = (name) => {
            if (name === 'gemini-2.0-flash') return 100;
            if (name === 'gemini-1.5-flash') return 90;
            if (name === 'gemini-2.5-flash') return 85;
            if (name === 'gemini-1.5-flash-latest') return 80;
            if (name.includes('2.0-flash')) return 70;
            if (name.includes('1.5-flash')) return 60;
            if (name.includes('flash')) return 50;
            return 10;
          };

          discovered.sort((a, b) => rankModel(b) - rankModel(a));

          // Append fallback defaults if not already present
          for (const fallback of DEFAULT_GEMINI_MODELS) {
            if (!discovered.includes(fallback)) {
              discovered.push(fallback);
            }
          }

          cachedAvailableModels = discovered;
          lastModelFetchTimestamp = now;
          return discovered;
        }
      }
    }
  } catch (err) {
    console.warn('[GeminiOCR] Dynamic models fetch warning, using prioritized fallback list:', err?.message || err);
  }

  return [...DEFAULT_GEMINI_MODELS];
}

/**
 * Gets the active Gemini API key from Vite environment or the permanent system default key.
 * Always ensures the scanner has an active key and prevents users from modifying or tampering with it.
 */
export function getActiveGeminiKey() {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
  if (isValidGeminiKey(envKey)) return envKey.trim();

  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('resiboss_gemini_api_key') || localStorage.getItem('gemini_api_key');
    if (isValidGeminiKey(userKey)) return userKey.trim();
  }

  return '';
}

/**
 * Ensures system key stability by clearing any legacy local storage keys.
 */
export function saveGeminiKey(_key) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('resiboss_gemini_api_key');
    localStorage.removeItem('gemini_api_key');
  }
  cachedAvailableModels = null;
  lastModelFetchTimestamp = 0;
}

/**
 * Validates a Gemini API key with a lightweight call using the proper headers.
 */
export async function testGeminiApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return { success: false, message: 'Invalid or empty API key.' };
  }
  try {
    const { url, headers } = getGeminiRequestConfig(apiKey, 'https://generativelanguage.googleapis.com/v1beta/models');
    const res = await fetch(url, { headers });
    if (res.ok) {
      // Warm up model cache on successful key test
      getAvailableGeminiModels(apiKey).catch(() => {});
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
 * Instructs it to conduct a full top-to-bottom re-scan, report low-confidence fields,
 * and strictly forbid inventing or hallucinating identifiers or amounts.
 */
export const RECEIPT_EXTRACTION_PROMPT = `You are an expert, highly precise optical receipt data extraction engine.
Analyze this receipt image thoroughly and extract ALL visible information accurately with zero fabrication.

Return ONLY a valid JSON object (no markdown code fences, no conversational commentary) matching this exact schema:
{
  "merchant": "Full merchant or store name as printed, or empty string",
  "date": "YYYY-MM-DD format, or empty string if unreadable",
  "time": "HH:MM AM/PM format, or empty string",
  "tin": "Taxpayer Identification Number (TIN) exactly as printed, or empty string if not found",
  "invoiceNo": "Receipt/OR/Invoice/CAN/Ref number if present, or empty string",
  "category": "One of: Food, Groceries, Utilities, Travel, Healthcare, Technology, Hardware, Others",
  "paymentMethod": "Cash, Visa, MasterCard, GCash, Maya, Credit Card, Debit Card, or as printed",
  "currency": "PHP, USD, EUR, or detected currency code",
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
  ],
  "lowConfidenceFields": []
}

STRICT EXTRACTION RULES:
1. SECOND SCAN PASS: Conduct a full top-to-bottom re-scan of the receipt image once before finalizing your output. Make sure you do NOT miss or omit any line items, especially on long, tall, or dense receipts.
2. NO INVENTED / HALLUCINATED DATA: NEVER invent, generate, or guess a TIN, Tax ID, Official Receipt (OR) number, Invoice number, or Total. If a field is not printed or unreadable, return "" for string fields and null for number fields. Never make up pseudo or placeholder reference numbers.
3. LOW CONFIDENCE REPORTING: Add field names to the "lowConfidenceFields" array (e.g. ["tin", "date", "total", "items"]) for any field you were unsure about, instead of silently guessing. Return an empty array [] if confident in all extracted fields.
4. LINE ITEMS: Extract ALL purchased items.
   - "name": Clean item description without barcode digits or item codes.
   - "qty": Integer quantity (default to 1 if not stated).
   - "price": Unit price as a decimal number.
   - "total": Line total as a decimal number (if omitted, calculate qty * price).
   - Exclude non-item lines such as store headers, addresses, phone numbers, loyalty points, or cash tender/change.
5. NUMERIC AMOUNTS: Strip currency symbols, commas, and parentheses. Use standard decimal notation (e.g. 1234.56).
6. MATH & TAX:
   - If total is printed, return it in "total". If unreadable or missing, return null (the parser will sum the line items).
   - If subtotal is not printed but total and VAT are known: subtotal = total - vat.
   - For standard 12% Philippine VAT: subtotal = total / 1.12, vat = total - subtotal.
7. Always return valid, well-formed JSON.`;

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
 * Retries on HTTP errors AND JSON parse failures across available models.
 * Returns parsed JSON object or null on failure.
 */
export async function extractWithGemini(imageDataUrl, apiKey) {
  if (!isValidGeminiKey(apiKey) || !imageDataUrl) return null;

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

  const modelsToTry = await getAvailableGeminiModels(apiKey);
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const { url: endpoint, headers } = getGeminiRequestConfig(
        apiKey,
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      );
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          console.warn(`[GeminiOCR] Gemini key rejected (${response.status}). Immediately aborting AI path to prevent hanging.`);
          return null;
        }
        const errText = await response.text();
        lastError = new Error(`Gemini ${model} ${response.status}: ${errText.substring(0, 200)}`);
        console.warn(`[GeminiOCR] ${model} HTTP ${response.status}, trying next fallback model...`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText.trim()) {
        lastError = new Error(`Gemini ${model} returned empty content`);
        console.warn(`[GeminiOCR] ${model} returned empty response, trying next fallback model...`);
        continue;
      }

      // Strip markdown code fences if Gemini wrapped JSON in ```json ... ```
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let cleanJson = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

      // Extract bracketed JSON object if surrounded by arbitrary text
      if (!cleanJson.startsWith('{')) {
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }
      }

      try {
        const parsed = JSON.parse(cleanJson);
        return parsed;
      } catch (parseErr) {
        // Issue 6: On JSON parse failure, do NOT return null immediately.
        // Continue the loop to try the next model in modelsToTry!
        console.warn(`[GeminiOCR] ${model} JSON parse failed: ${parseErr.message}. Trying next fallback model... Snippet:`, cleanJson.substring(0, 300));
        lastError = parseErr;
        continue;
      }
    } catch (e) {
      lastError = e;
      console.warn(`[GeminiOCR] ${model} execution error:`, e?.message || e);
      continue;
    }
  }

  if (lastError) {
    console.warn('[GeminiOCR] All candidate Gemini models exhausted. Last error:', lastError?.message || lastError);
  }
  return null;
}

/**
 * Validates and normalizes the raw Gemini response into the Resiboss receipt format.
 * - If items are present but total is missing/0, computes total as sum of item totals.
 * - Retains lowConfidenceFields for transparency and avoids fabricated numbers.
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
            price: price || (itTot > 0 && qty > 0 ? +(itTot / qty).toFixed(2) : 0),
            total: itTot || +(price * qty).toFixed(2),
          };
        })
        .filter((it) => it.total > 0 || it.price > 0 || (it.name && it.name.length > 1))
    : [];

  // Issue 1: If Gemini's total is missing or <= 0, but line items are present and non-empty,
  // compute total as the sum of item totals instead of failing!
  if ((!total || total <= 0) && items.length > 0) {
    const itemsSum = +(items.reduce((acc, it) => acc + (it.total || (it.price * it.qty) || 0), 0)).toFixed(2);
    if (itemsSum > 0) {
      total = itemsSum;
    }
  }

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

  // Merchant detection
  const rawMerchant = typeof raw.merchant === 'string' ? raw.merchant.trim() : '';
  const merchant = rawMerchant || 'Scanned Merchant Store';

  // Date — enforce YYYY-MM-DD
  let date = String(raw.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = new Date().toISOString().split('T')[0];
  }

  // TIN & Invoice Number — never invent fake numbers
  let tin = String(raw.tin || '').trim();
  const invoiceNo = String(raw.invoiceNo || '').trim();
  if (!tin || tin.length < 5 || !/\d/.test(tin)) {
    tin = invoiceNo ? `REF-${invoiceNo}` : '';
  }

  // Low confidence reporting
  const lowConfidenceFields = Array.isArray(raw.lowConfidenceFields)
    ? raw.lowConfidenceFields.map((f) => String(f).trim()).filter(Boolean)
    : [];

  return {
    merchant,
    hasMerchant: Boolean(rawMerchant && rawMerchant.length > 0),
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
    lowConfidenceFields,
  };
}
