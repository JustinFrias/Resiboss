/**
 * Resiboss 2.0 — Feature Flags
 *
 * Centralised gate for all features. Flip any flag here to enable/disable
 * a feature across the entire app without touching component code.
 *
 * Future monetisation: replace the boolean values with a function that reads
 * the user's subscription tier — no changes needed in individual components.
 */

export const FEATURES = {
  // Core (always on)
  RECEIPT_SCANNER: true,
  RECEIPT_VAULT: true,
  DASHBOARD: true,
  ANALYTICS: true,
  EXPORT_EXCEL: true,
  SETTINGS: true,

  // Resiboss 2.0 — Intelligence Layer
  INSIGHTS_VIEW: true,          // InsightsView tab
  SHOPPING_LIST: true,          // ShoppingListView tab
  ASK_RESIBOSS: true,           // AskResibossView tab
  PRICE_HISTORY: true,          // Item price history in receipt detail
  PURCHASE_PATTERNS: true,      // Pattern detection + dashboard nudges
  DUPLICATE_DETECTION: true,    // Warn before saving a likely duplicate
  CONFIDENCE_BADGES: true,      // Per-item OCR confidence indicator in scanner
  CONSISTENCY_CHECK: true,      // Validate sum(items) ≈ total in scanner
  RECEIPT_DETAIL_PAGE: true,    // Full-screen receipt detail with insights panel

  // Future / Pro-only placeholders (disabled until ready)
  BANKING_IMPORT: false,
  EMAIL_RECEIPT_IMPORT: false,
  WARRANTY_MANAGEMENT: false,
  FAMILY_ACCOUNTS: false,
};

/**
 * Check if a feature is enabled.
 * Usage: isEnabled(FEATURES.ASK_RESIBOSS)
 */
export const isEnabled = (flag) => Boolean(flag);
