import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials have been configured with real values
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

// Create Supabase Client instance (with safe dummy fallback if not configured yet)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Syncs a receipt document with the Supabase 'receipts' table.
 */
export const syncReceiptToSupabase = async (receiptDoc) => {
  if (!supabase || !isSupabaseConfigured) {
    console.info('Supabase not configured yet. Receipt stored in local storage.');
    return { data: null, error: null, isLocal: true };
  }

  try {
    const payload = {
      id: receiptDoc.id,
      merchant: receiptDoc.merchant,
      date: receiptDoc.date,
      time: receiptDoc.time,
      tin: receiptDoc.tin,
      category: receiptDoc.category,
      payment_method: receiptDoc.paymentMethod,
      subtotal: receiptDoc.subtotal,
      vat: receiptDoc.vat,
      total: receiptDoc.total,
      currency: receiptDoc.currency || 'PHP',
      confidence: receiptDoc.confidence,
      raw_ocr_text: receiptDoc.rawOcrText,
      items: receiptDoc.items || [],
      status: receiptDoc.status || 'Verified',
      image_uri: receiptDoc.imageUri || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('receipts')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase sync error:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Supabase error:', err);
    return { data: null, error: err };
  }
};

/**
 * Fetches all receipts from Supabase 'receipts' table.
 */
export const fetchReceiptsFromSupabase = async () => {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('Failed to fetch from Supabase:', err.message);
    return { data: null, error: err };
  }
};
