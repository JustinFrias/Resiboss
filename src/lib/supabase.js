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

// Ensure old permanent sessions stored in localStorage are purged so closing the app resets session
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem('resiboss_user_profile_v1');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') && k.endsWith('-auth-token'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
}

// Create Supabase Client instance with session-only storage (cleared when app is closed)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
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
  userId: row.user_id || row.userId || null,
  userEmail: row.user_email || row.userEmail || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Syncs a receipt document with the Supabase 'receipts' table with account isolation.
 */
export const syncReceiptToSupabase = async (receiptDoc, userProfile) => {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: null, isLocal: true };
  }

  const userId = userProfile?.id || receiptDoc.userId || null;
  const userEmail = (userProfile?.email || receiptDoc.userEmail || '').trim().toLowerCase() || null;

  const basePayload = {
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

  const payloadWithUser = {
    ...basePayload,
    user_id: userId,
    user_email: userEmail,
  };

  try {
    // Attempt upsert with user isolation columns
    let { data, error } = await supabase
      .from('receipts')
      .upsert([payloadWithUser], { onConflict: 'id' })
      .select();

    // Fallback if table doesn't have user_id / user_email columns yet
    if (error && (error.message?.includes('user_id') || error.message?.includes('user_email') || error.code === 'PGRST204')) {
      const retry = await supabase
        .from('receipts')
        .upsert([basePayload], { onConflict: 'id' })
        .select();
      data = retry.data;
      error = retry.error;
    }

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
 * Fetches only the receipts belonging to the authenticated user account.
 */
export const fetchReceiptsFromSupabase = async (userProfile) => {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: null };
  }

  const userId = userProfile?.id || null;
  const userEmail = (userProfile?.email || '').trim().toLowerCase() || null;

  // Unauthenticated or Guest sessions should not pull cloud receipts of other accounts
  if (!userId && !userEmail) {
    return { data: [], error: null };
  }

  try {
    let query = supabase.from('receipts').select('*').order('date', { ascending: false });

    if (userId && userEmail) {
      query = query.or(`user_id.eq.${userId},user_email.eq.${userEmail}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('user_email', userEmail);
    }

    let { data, error } = await query;

    // Fallback if columns don't exist yet on remote schema
    if (error && (error.message?.includes('user_id') || error.message?.includes('user_email') || error.code === 'PGRST204')) {
      const fallback = await supabase.from('receipts').select('*').order('date', { ascending: false });
      if (fallback.error) throw fallback.error;
      // Client-side privacy filter: only include receipts tagged for this user
      const filtered = (fallback.data || []).filter((row) => {
        if (row.user_id && row.user_id === userId) return true;
        if (row.user_email && row.user_email.toLowerCase() === userEmail) return true;
        return false;
      });
      return { data: filtered, error: null };
    }

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('Failed to fetch from Supabase:', err.message);
    return { data: null, error: err };
  }
};
