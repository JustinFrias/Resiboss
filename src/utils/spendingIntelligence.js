/**
 * Resiboss 2.0 — Spending Intelligence Engine
 *
 * All computations run client-side over the receipts array.
 * Pure functions — no side effects, safe to call in useMemo.
 */

// ==============================================================================
// CATEGORY SPENDING
// ==============================================================================

/**
 * Returns spending totals grouped by category, sorted descending.
 */
export function getCategorySpending(documents) {
  const map = {};
  documents.forEach((doc) => {
    const cat = doc.category || 'Other';
    if (!map[cat]) map[cat] = { total: 0, count: 0 };
    map[cat].total += Number(doc.total) || 0;
    map[cat].count += 1;
  });
  return Object.entries(map)
    .map(([category, data]) => ({ category, total: data.total, count: data.count }))
    .sort((a, b) => b.total - a.total);
}

// ==============================================================================
// MONTHLY SPENDING
// ==============================================================================

/**
 * Returns spending total for a given year-month string (e.g. '2026-09').
 */
export function getMonthlySpend(documents, yearMonth) {
  return documents
    .filter((d) => d.date && String(d.date).startsWith(yearMonth))
    .reduce((sum, d) => sum + (Number(d.total) || 0), 0);
}

/**
 * Returns the current month's spending and the previous month's spending.
 */
export function getMonthOverMonthSpend(documents) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const current = getMonthlySpend(documents, currentYM);
  const previous = getMonthlySpend(documents, prevYM);
  const delta = current - previous;
  const deltaPercent = previous > 0 ? ((delta / previous) * 100).toFixed(1) : null;

  return { current, previous, delta, deltaPercent, currentYM, prevYM };
}

// ==============================================================================
// STORE FREQUENCY
// ==============================================================================

/**
 * Returns a list of { merchant, count, totalSpend } sorted by visit count.
 */
export function getStoreFrequency(documents) {
  const map = {};
  documents.forEach((doc) => {
    const key = (doc.merchant || 'Unknown').trim();
    if (!map[key]) map[key] = { merchant: key, count: 0, totalSpend: 0 };
    map[key].count += 1;
    map[key].totalSpend += Number(doc.total) || 0;
  });
  return Object.values(map)
    .map((s) => ({ ...s, avgTotal: s.count > 0 ? s.totalSpend / s.count : 0 }))
    .sort((a, b) => b.count - a.count);
}

// ==============================================================================
// ITEM INTELLIGENCE (operates over receipts[].items JSONB array)
// ==============================================================================

/**
 * Flattens all items across all receipts into a normalised list.
 * Each entry: { name, price, quantity, receiptId, merchant, date }
 */
export function getAllItems(documents) {
  const items = [];
  documents.forEach((doc) => {
    if (!Array.isArray(doc.items)) return;
    doc.items.forEach((item) => {
      if (!item || !item.name) return;
      items.push({
        name: normaliseItemName(item.name),
        rawName: item.name,
        price: Number(item.price || item.amount || item.total || 0),
        quantity: Number(item.quantity || item.qty || 1),
        receiptId: doc.id,
        merchant: doc.merchant || '',
        date: doc.date || '',
      });
    });
  });
  return items;
}

/**
 * Normalises an item name for grouping (trim, lowercase, remove qty prefixes).
 */
function normaliseItemName(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/^\d+x\s+/i, '') // remove "2x " prefix
    .replace(/\s+/g, ' ');
}

/**
 * Groups items by normalised name.
 * Returns { [name]: { name, purchases: [{price, date, merchant, receiptId}], ... } }
 */
export function getItemHistory(documents) {
  const all = getAllItems(documents);
  const grouped = {};

  all.forEach((item) => {
    if (!grouped[item.name]) {
      grouped[item.name] = {
        name: item.name,
        displayName: item.rawName,
        purchases: [],
      };
    }
    grouped[item.name].purchases.push({
      price: item.price,
      date: item.date,
      merchant: item.merchant,
      receiptId: item.receiptId,
      quantity: item.quantity,
    });
  });

  // Sort purchases within each group chronologically
  Object.values(grouped).forEach((g) => {
    g.purchases.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  return grouped;
}

/**
 * Returns a map of item display names to an array of purchase records:
 * { [displayName]: [ { price, date, merchant, receiptId, quantity } ] }
 */
export function getItemPriceHistory(documents) {
  const grouped = getItemHistory(documents);
  const result = {};
  Object.values(grouped).forEach((g) => {
    if (g.purchases && g.purchases.length > 0) {
      result[g.displayName || g.name] = g.purchases;
    }
  });
  return result;
}

/**
 * For a single item group, compute summary stats.
 */
export function getItemStats(itemGroup) {
  const prices = itemGroup.purchases.map((p) => p.price).filter((p) => p > 0);
  if (prices.length === 0) return null;

  const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const lastPurchase = itemGroup.purchases[itemGroup.purchases.length - 1];
  const firstPurchase = itemGroup.purchases[0];
  const count = itemGroup.purchases.length;

  // Price trend: compare last vs second-to-last
  const priceChange =
    prices.length >= 2
      ? prices[prices.length - 1] - prices[prices.length - 2]
      : null;

  return {
    count,
    avgPrice,
    minPrice,
    maxPrice,
    lastPrice: lastPurchase.price,
    lastDate: lastPurchase.date,
    lastMerchant: lastPurchase.merchant,
    firstDate: firstPurchase.date,
    priceChange,
    priceChangePct:
      priceChange !== null && prices[prices.length - 2] > 0
        ? ((priceChange / prices[prices.length - 2]) * 100).toFixed(1)
        : null,
  };
}

// ==============================================================================
// PURCHASE PATTERN DETECTION
// ==============================================================================

/**
 * Detects purchase patterns for items with 3+ purchases.
 * Returns array of { name, displayName, avgIntervalDays, lastDate, nextExpected, confidence }
 */
export function getPurchasePatterns(documents) {
  const itemHistory = getItemHistory(documents);
  const patterns = [];

  Object.values(itemHistory).forEach((group) => {
    if (group.purchases.length < 3) return; // need 3+ data points

    const dates = group.purchases
      .map((p) => p.date)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d))
      .sort((a, b) => a - b);

    if (dates.length < 3) return;

    // Compute intervals in days between consecutive purchases
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const diffMs = dates[i] - dates[i - 1];
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 0 && diffDays < 365) intervals.push(diffDays);
    }

    if (intervals.length === 0) return;

    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const lastDate = dates[dates.length - 1];
    const nextExpected = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
    const today = new Date();
    const daysUntilNext = Math.round((nextExpected - today) / (1000 * 60 * 60 * 24));
    const daysSinceLast = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    // Confidence based on number of purchases and interval consistency
    const stdDev = Math.sqrt(
      intervals.reduce((s, v) => s + Math.pow(v - avgInterval, 2), 0) / intervals.length
    );
    const cv = stdDev / avgInterval; // coefficient of variation
    const confidence = group.purchases.length >= 5 && cv < 0.3
      ? 'high'
      : group.purchases.length >= 3 && cv < 0.5
      ? 'medium'
      : 'low';

    const prices = group.purchases.map((p) => p.price).filter((p) => p > 0);
    const avgAmount = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;

    patterns.push({
      name: group.name,
      displayName: group.displayName,
      count: group.purchases.length,
      avgIntervalDays: Math.round(avgInterval),
      avgAmount,
      lastDate: lastDate.toISOString().slice(0, 10),
      nextExpected: nextExpected.toISOString().slice(0, 10),
      daysUntilNext,
      daysSinceLast,
      isDue: daysUntilNext <= 3,
      isOverdue: daysUntilNext < 0,
      confidence,
      lastMerchant: group.purchases[group.purchases.length - 1].merchant,
    });
  });

  // Sort: overdue first, then due soon, then by next expected date
  return patterns.sort((a, b) => a.daysUntilNext - b.daysUntilNext);
}

// ==============================================================================
// DUPLICATE DETECTION
// ==============================================================================

/**
 * Checks if a candidate receipt is likely a duplicate of an existing one.
 * Returns { isDuplicate, match, confidence } or { isDuplicate: false }
 */
export function detectDuplicate(candidate, existingDocuments) {
  if (!candidate || !existingDocuments?.length) return { isDuplicate: false };

  const candidateMerchant = (candidate.merchant || '').toLowerCase().trim();
  const candidateDate = candidate.date;
  const candidateTotal = Number(candidate.total) || 0;
  const candidateReceiptNum = (candidate.receiptNumber || '').trim();

  for (const doc of existingDocuments) {
    // Receipt number match (strongest signal)
    if (
      candidateReceiptNum &&
      doc.receiptNumber &&
      candidateReceiptNum === doc.receiptNumber.trim()
    ) {
      return { isDuplicate: true, match: doc, confidence: 'high', reason: 'receipt_number' };
    }

    // Same merchant + date + total (very strong signal)
    const docMerchant = (doc.merchant || '').toLowerCase().trim();
    const totalDiff = Math.abs((Number(doc.total) || 0) - candidateTotal);
    const totalMatch = candidateTotal > 0 && totalDiff / (candidateTotal || 1) < 0.01;

    if (docMerchant === candidateMerchant && doc.date === candidateDate && totalMatch) {
      return { isDuplicate: true, match: doc, confidence: 'high', reason: 'merchant_date_total' };
    }

    // Same merchant + date + approximate total (medium signal)
    if (docMerchant === candidateMerchant && doc.date === candidateDate && totalDiff < 5) {
      return { isDuplicate: true, match: doc, confidence: 'medium', reason: 'merchant_date_approx_total' };
    }
  }

  return { isDuplicate: false };
}

// ==============================================================================
// SMART SUGGESTIONS FOR SHOPPING LIST
// ==============================================================================

/**
 * Returns item names that are likely to be purchased soon based on patterns.
 * Items that are due or overdue and have medium/high confidence.
 */
export function getSmartShoppingSuggestions(documents, existingListItems = []) {
  const patterns = getPurchasePatterns(documents);
  const existingNames = new Set(existingListItems.map((i) => i.name.toLowerCase().trim()));

  return patterns
    .filter(
      (p) =>
        (p.isDue || p.isOverdue || p.daysUntilNext <= 7) &&
        (p.confidence === 'high' || p.confidence === 'medium') &&
        !existingNames.has(p.name)
    )
    .slice(0, 5) // max 5 suggestions
    .map((p) => ({
      name: p.displayName,
      reason: p.isOverdue
        ? `Usually purchased every ${p.avgIntervalDays} days — overdue`
        : `Usually purchased every ${p.avgIntervalDays} days`,
      confidence: p.confidence,
    }));
}

/**
 * Alias for getSmartShoppingSuggestions
 */
export const getSmartShoppingList = (documents, existingListItems = []) =>
  getSmartShoppingSuggestions(documents, existingListItems);

// ==============================================================================
// AI QUERY HELPERS (DB-first answers for Ask Resiboss)
// ==============================================================================

/**
 * Builds a structured context object from receipts for a given intent.
 * Used by AskResibossView to answer questions without hallucination.
 */
export function buildQueryContext(documents, intent) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYear = now.getFullYear().toString();

  const { current: monthSpend } = getMonthOverMonthSpend(documents);
  const categorySpending = getCategorySpending(documents);
  const storeFreq = getStoreFrequency(documents);
  const totalSpend = documents.reduce((s, d) => s + (Number(d.total) || 0), 0);

  // Last 7 days spend
  const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekSpend = documents
    .filter((d) => d.date && new Date(d.date) >= past7)
    .reduce((s, d) => s + (Number(d.total) || 0), 0);

  // Year spend
  const yearSpend = documents
    .filter((d) => d.date && String(d.date).startsWith(currentYear))
    .reduce((s, d) => s + (Number(d.total) || 0), 0);

  return {
    totalSpend,
    monthSpend,
    weekSpend,
    yearSpend,
    receiptCount: documents.length,
    topCategory: categorySpending[0] || null,
    categorySpending,
    topStore: storeFreq[0] || null,
    storeFrequency: storeFreq,
    mostExpensiveReceipt: documents.reduce(
      (max, d) => (!max || (Number(d.total) || 0) > (Number(max.total) || 0) ? d : max),
      null
    ),
    recentReceipts: [...documents]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
  };
}
