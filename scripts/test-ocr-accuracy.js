import assert from 'node:assert/strict';
import { normalizeGeminiResult, getAvailableGeminiModels, DEFAULT_GEMINI_MODELS } from '../src/utils/geminiOcr.js';
import { parseAmount } from '../src/utils/receiptOcrParser.js';

console.log('🧪 Running Resiboss Receipt OCR Accuracy Test Suite...\n');

let passedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${name}:`, err.message);
    throw err;
  }
}

// =========================================================================
// TEST 1: GROCERY RECEIPT (Missing total, many line items)
// =========================================================================
runTest('Grocery: Computes total from items when Gemini total is missing / null', () => {
  const rawGrocery = {
    merchant: 'PUREGOLD PRICE CLUB',
    date: '2026-08-15',
    time: '02:30 PM',
    tin: '',
    invoiceNo: 'INV-449102',
    category: 'Groceries',
    paymentMethod: 'Cash',
    currency: 'PHP',
    subtotal: null,
    vat: null,
    total: null, // Total omitted by OCR
    items: [
      { name: 'Alaska Evaporated Milk 370ml', qty: 2, price: 34.50, total: 69.00 },
      { name: 'San Miguel Pale Pilsen 330ml 6pk', qty: 1, price: 295.00, total: 295.00 },
      { name: 'Datu Puti Vinegar 1L', qty: 1, price: 42.00, total: 42.00 },
      { name: 'White Sugar 1kg', qty: 2, price: 78.00, total: 156.00 },
    ],
    lowConfidenceFields: [],
  };

  const normalized = normalizeGeminiResult(rawGrocery, parseAmount);

  assert.ok(normalized, 'Result should not be null');
  assert.equal(normalized.merchant, 'PUREGOLD PRICE CLUB');
  assert.equal(normalized.items.length, 4);

  // Expected sum: 69.00 + 295.00 + 42.00 + 156.00 = 562.00
  assert.equal(normalized.total, 562.00, `Total should equal sum of items (562.00), got ${normalized.total}`);
  assert.ok(normalized.subtotal > 0, 'Subtotal should be calculated from total');
  assert.ok(normalized.vat > 0, 'VAT should be calculated');
  assert.equal(+(normalized.subtotal + normalized.vat).toFixed(2), 562.00, 'Subtotal + VAT must equal total');

  // TIN should not be fabricated
  assert.equal(normalized.tin, 'REF-INV-449102');
  assert.ok(!normalized.tin.startsWith('OR-'), 'Must not invent random OR- number');
});

// =========================================================================
// TEST 2: RESTAURANT RECEIPT (Faded total, line items present)
// =========================================================================
runTest('Restaurant: Reconciles total from item prices when total <= 0', () => {
  const rawRestaurant = {
    merchant: "BURGER KING®",
    date: '2026-09-10',
    time: '11:45 AM',
    tin: '',
    invoiceNo: '',
    category: 'Food',
    paymentMethod: 'GCash',
    currency: 'PHP',
    subtotal: 0,
    vat: 0,
    total: 0, // Total is zero / missing
    items: [
      { name: 'Whopper Jr Meal', qty: 2, price: 185.00, total: 370.00 },
      { name: '4 Pc Jalapeno Cheddar Bites', qty: 1, price: 89.00, total: 89.00 },
    ],
    lowConfidenceFields: ['total'],
  };

  const normalized = normalizeGeminiResult(rawRestaurant, parseAmount);

  assert.ok(normalized, 'Result should not be null');
  // Expected sum: 370 + 89 = 459.00
  assert.equal(normalized.total, 459.00, `Expected total 459.00, got ${normalized.total}`);
  assert.equal(normalized.tin, '', 'TIN must be empty string when not detected');
  assert.deepEqual(normalized.lowConfidenceFields, ['total']);
});

// =========================================================================
// TEST 3: GAS STATION RECEIPT (Low confidence detection & no fake TIN)
// =========================================================================
runTest('Gas Station: Preserves lowConfidenceFields and never fabricates TIN', () => {
  const rawGas = {
    merchant: 'SHELL MOBILITY EDSA',
    date: '2026-09-12',
    time: '08:15 AM',
    tin: null,
    invoiceNo: null,
    category: 'Travel',
    paymentMethod: 'Credit Card',
    currency: 'PHP',
    subtotal: 1785.71,
    vat: 214.29,
    total: 2000.00,
    items: [
      { name: 'Shell FuelSave Gasoline 31.25L', qty: 1, price: 2000.00, total: 2000.00 },
    ],
    lowConfidenceFields: ['tin', 'date'],
  };

  const normalized = normalizeGeminiResult(rawGas, parseAmount);

  assert.equal(normalized.total, 2000.00);
  assert.equal(normalized.tin, '', 'TIN must be empty string if not detected');
  assert.ok(!/OR-\d{6}/.test(normalized.tin), 'No random OR number');
  assert.deepEqual(normalized.lowConfidenceFields, ['tin', 'date'], 'Preserves lowConfidenceFields array');
});

// =========================================================================
// TEST 4: UTILITY BILL RECEIPT (CAN as invoice, no line items)
// =========================================================================
runTest('Utility Bill: Handles account number as reference without fake TIN', () => {
  const rawUtility = {
    merchant: 'MERALCO ELECTRIC',
    date: '2026-08-30',
    time: '12:00 PM',
    tin: '',
    invoiceNo: 'CAN-123456789012',
    category: 'Utilities',
    paymentMethod: 'Cash',
    currency: 'PHP',
    subtotal: 3125.00,
    vat: 375.00,
    total: 3500.00,
    items: [],
    lowConfidenceFields: [],
  };

  const normalized = normalizeGeminiResult(rawUtility, parseAmount);

  assert.equal(normalized.merchant, 'MERALCO ELECTRIC');
  assert.equal(normalized.tin, 'REF-CAN-123456789012');
  assert.equal(normalized.total, 3500.00);
  assert.ok(normalized.hasMerchant, 'hasMerchant must be true');
});

// =========================================================================
// TEST 5: FADED THERMAL PAPER RECEIPT (Partial Gemini result kept)
// =========================================================================
runTest('Faded Thermal: Merchant recognized but prices unreadable - Gemini accepted', () => {
  const rawFaded = {
    merchant: '7-ELEVEN',
    date: '2026-09-01',
    time: '',
    tin: '',
    invoiceNo: '',
    category: 'Food',
    paymentMethod: 'Cash',
    currency: 'PHP',
    subtotal: null,
    vat: null,
    total: null,
    items: [],
    lowConfidenceFields: ['total', 'items', 'tin'],
  };

  const normalized = normalizeGeminiResult(rawFaded, parseAmount);

  assert.ok(normalized, 'Normalized should not be null');
  assert.equal(normalized.hasMerchant, true, 'hasMerchant must be true');
  assert.equal(normalized.merchant, '7-ELEVEN');
  assert.equal(normalized.tin, '', 'TIN must remain empty string without fake numbers');
  assert.deepEqual(normalized.lowConfidenceFields, ['total', 'items', 'tin']);
});

// =========================================================================
// TEST 6: COMPLETELY BLANK / UNUSABLE (Falls back to Tesseract)
// =========================================================================
runTest('Blank Image: Gemini returned no merchant and no items - detects unusable', () => {
  const rawBlank = {
    merchant: '',
    date: '',
    tin: '',
    invoiceNo: '',
    total: null,
    items: [],
  };

  const normalized = normalizeGeminiResult(rawBlank, parseAmount);

  const hasMerchant = Boolean(normalized?.hasMerchant && normalized.merchant && normalized.merchant !== 'Scanned Merchant Store');
  const hasItems = Array.isArray(normalized?.items) && normalized.items.length > 0;
  const hasUsableData = Boolean(normalized && (hasMerchant || hasItems || (normalized.total && normalized.total > 0)));

  assert.equal(hasUsableData, false, 'Blank data with no merchant and no items must be marked unusable');
});

// =========================================================================
// TEST 8: RETRY ON PARSE FAILURE (extractWithGemini continues to next model)
// =========================================================================
runTest('Retry on Parse Failure: Continues to next model if model 1 returns invalid JSON', async () => {
  const { extractWithGemini } = await import('../src/utils/geminiOcr.js');

  const originalFetch = global.fetch;
  let callCount = 0;
  const attemptedModels = [];

  global.fetch = async (url) => {
    callCount++;
    const match = url.match(/models\/([^:]+):generateContent/);
    const model = match ? match[1] : `call-${callCount}`;
    attemptedModels.push(model);

    if (callCount === 1) {
      // Model 1 returns non-JSON / broken syntax
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Here is your receipt: { "merchant": "Unclosed string' }] }
          }]
        }),
      };
    }

    // Model 2 returns valid JSON
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: '```json\n{"merchant": "Success Model 2", "total": 120.00}\n```' }] }
        }]
      })
    };
  };

  try {
    const result = await extractWithGemini('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'test-api-key-123456');

    assert.ok(result, 'Result should be returned from model 2');
    assert.equal(result.merchant, 'Success Model 2');
    assert.equal(result.total, 120.00);
    assert.ok(attemptedModels.length >= 2, `Should have tried at least 2 models, tried: ${attemptedModels.join(', ')}`);
  } finally {
    global.fetch = originalFetch;
  }
});

// =========================================================================
// TEST 9: DYNAMIC MODEL DISCOVERY VIA API
// =========================================================================
runTest('Dynamic Model Discovery: Discovers and sorts models dynamically from API', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (url.includes('/models?key=')) {
      return {
        ok: true,
        json: async () => ({
          models: [
            { name: 'models/gemini-1.0-pro', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-1.5-flash', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
            { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
          ]
        })
      };
    }
    return originalFetch(url);
  };

  try {
    const models = await getAvailableGeminiModels('valid-test-key-999999');
    assert.ok(Array.isArray(models), 'Should return array of models');
    assert.equal(models[0], 'gemini-2.0-flash', 'gemini-2.0-flash should be ranked first');
    assert.ok(models.includes('gemini-1.5-flash'));
    assert.ok(!models.includes('text-embedding-004'), 'Must not include non-flash / embedding models');
  } finally {
    global.fetch = originalFetch;
  }
});

console.log(`\n🎉 All tests passed successfully!`);


