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

// Create Supabase Client instance with robust Auth & Realtime settings
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Maps a Supabase row back to our frontend receipt document model.
 */
export const mapSupabaseToDoc = (row) => ({
  id: row.id,
  merchant: row.merchant,
  date: row.date,
  time: row.time || '12:00 PM',
  tin: row.tin || '000-000-000-000',
  category: row.category || 'Food',
  paymentMethod: row.payment_method || 'Cash',
  subtotal: Number(row.subtotal) || 0,
  vat: Number(row.vat) || 0,
  total: Number(row.total) || 0,
  currency: row.currency || 'PHP',
  confidence: Number(row.confidence) || 99.8,
  rawOcrText: row.raw_ocr_text || '',
  items: Array.isArray(row.items) ? row.items : [],
  status: row.status || 'Verified',
  imageUri: row.image_uri || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Syncs a receipt document with the Supabase 'receipts' table in real-time.
 */
export const syncReceiptToSupabase = async (receiptDoc) => {
  if (!supabase || !isSupabaseConfigured) {
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
 * Deletes a receipt from Supabase 'receipts' table in real-time.
 */
export const deleteReceiptFromSupabase = async (id) => {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    const { error } = await supabase.from('receipts').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete error:', error.message);
    }
  } catch (err) {
    console.error('Unexpected Supabase delete error:', err);
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
      .order('date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('Failed to fetch from Supabase:', err.message);
    return { data: null, error: err };
  }
};
