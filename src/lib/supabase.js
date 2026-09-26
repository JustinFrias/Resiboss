import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ruxbdordehhvklnyxmcw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eGJkb3JkZWhodmtsbnl4bWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDc1ODYsImV4cCI6MjEwNDI4MzU4Nn0._-ZqGs72P2hHHLPxC3utHSzWWSI5R27MEuP1bdYVem8';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
    },
  })
  : null;

// ==============================================================================
// RECEIPT MAPPING
// ==============================================================================

/**
 * Maps a Supabase receipts row to the frontend receipt document model.
 */
export const mapSupabaseToDoc = (row) => ({
  id: row.id,
  merchant: row.merchant,
  date: row.date,
  time: row.time || '12:00 PM',
  tin: row.tin || '',
  branch: row.branch || null,
  receiptNumber: row.receipt_number || null,
  category: row.category || 'Food',
  paymentMethod: row.payment_method || 'Cash',
  subtotal: Number(row.subtotal) || 0,
  vat: Number(row.vat) || 0,
  discount: Number(row.discount) || 0,
  total: Number(row.total) || 0,
  currency: row.currency || 'PHP',
  confidence: row.confidence !== undefined && row.confidence !== null ? Number(row.confidence) : null,
  rawOcrText: row.raw_ocr_text || '',
  items: Array.isArray(row.items) ? row.items : [],
  status: row.status || 'Verified',
  imageUri: row.image_uri || null,
  notes: row.notes || null,
  userId: row.user_id || null,
  userEmail: row.user_email || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ==============================================================================
// RECEIPT CRUD
// ==============================================================================

/**
 * Upserts a receipt document to Supabase with user isolation.
 */
export const syncReceiptToSupabase = async (receiptDoc, userProfile) => {
  if (!supabase || !isSupabaseConfigured) {
    return { data: null, error: null, isLocal: true };
  }

  const userId = userProfile?.id || receiptDoc.userId || null;
  const userEmail = (userProfile?.email || receiptDoc.userEmail || '').trim().toLowerCase() || null;

  const payload = {
    id: receiptDoc.id,
    merchant: receiptDoc.merchant,
    date: receiptDoc.date,
    time: receiptDoc.time,
    tin: receiptDoc.tin,
    branch: receiptDoc.branch || null,
    receipt_number: receiptDoc.receiptNumber || null,
    category: receiptDoc.category,
    payment_method: receiptDoc.paymentMethod,
    subtotal: receiptDoc.subtotal,
    vat: receiptDoc.vat,
    discount: receiptDoc.discount || 0,
    total: receiptDoc.total,
    currency: receiptDoc.currency || 'PHP',
    confidence: receiptDoc.confidence,
    raw_ocr_text: receiptDoc.rawOcrText,
    items: receiptDoc.items || [],
    status: receiptDoc.status || 'Verified',
    image_uri: receiptDoc.imageUri || null,
    notes: receiptDoc.notes || null,
    user_id: userId,
    user_email: userEmail,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('receipts')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[Resiboss] Supabase sync error:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[Resiboss] Unexpected Supabase error:', err);
    return { data: null, error: err };
  }
};

/**
 * Deletes a receipt from Supabase.
 */
export const deleteReceiptFromSupabase = async (id) => {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('receipts').delete().eq('id', id);
    if (error) console.warn('[Resiboss] Supabase delete error:', error.message);
  } catch (err) {
    console.error('[Resiboss] Unexpected Supabase delete error:', err);
  }
};

/**
 * Fetches all receipts belonging to the authenticated user.
 */
export const fetchReceiptsFromSupabase = async (userProfile) => {
  if (!supabase || !isSupabaseConfigured) return { data: null, error: null };

  const userId = userProfile?.id || null;
  const userEmail = (userProfile?.email || '').trim().toLowerCase() || null;

  if (!userId && !userEmail) return { data: [], error: null };

  try {
    let query = supabase.from('receipts').select('*').order('date', { ascending: false });

    if (userId && userEmail) {
      query = query.or(`user_id.eq.${userId},user_email.eq.${userEmail}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('user_email', userEmail);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('[Resiboss] Failed to fetch receipts:', err.message);
    return { data: null, error: err };
  }
};

// ==============================================================================
// SHOPPING LIST CRUD
// ==============================================================================

/**
 * Fetches all shopping list items for the authenticated user.
 */
export const fetchShoppingListFromSupabase = async (userId) => {
  if (!supabase || !isSupabaseConfigured || !userId) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.warn('[Resiboss] Failed to fetch shopping list:', err.message);
    return { data: [], error: err };
  }
};

/**
 * Upserts a shopping list item.
 */
export const upsertShoppingItemToSupabase = async (item) => {
  if (!supabase || !isSupabaseConfigured) return { data: null, error: null, isLocal: true };
  try {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .upsert([{ ...item, updated_at: new Date().toISOString() }], { onConflict: 'id' })
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('[Resiboss] Shopping list sync error:', err.message);
    return { data: null, error: err };
  }
};

/**
 * Deletes a shopping list item.
 */
export const deleteShoppingItemFromSupabase = async (id) => {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
    if (error) console.warn('[Resiboss] Shopping delete error:', error.message);
  } catch (err) {
    console.error('[Resiboss] Shopping delete unexpected error:', err);
  }
};

/**
 * High-level shopping list helpers for ShoppingListView
 */
export const fetchShoppingList = async (userId) => {
  const { data, error } = await fetchShoppingListFromSupabase(userId);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    completed: Boolean(row.is_checked),
    is_suggestion: Boolean(row.is_suggested),
    suggested_reason: row.suggested_reason || '',
    sort_order: row.sort_order || 0,
  }));
};

export const addShoppingItem = async (userId, name, isSuggestion = false, reason = '') => {
  const id = `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (!supabase || !isSupabaseConfigured || !userId) {
    return {
      id,
      name,
      completed: false,
      is_suggestion: isSuggestion,
      suggested_reason: reason,
    };
  }
  const payload = {
    id,
    user_id: userId,
    name,
    is_checked: false,
    is_suggested: isSuggestion,
    suggested_reason: reason,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await supabase.from('shopping_list_items').insert([payload]).select().single();
    if (error) {
      console.warn('[Resiboss] addShoppingItem error:', error.message);
      return { id, name, completed: false, is_suggestion: isSuggestion, suggested_reason: reason };
    }
    return {
      id: data.id,
      name: data.name,
      completed: Boolean(data.is_checked),
      is_suggestion: Boolean(data.is_suggested),
      suggested_reason: data.suggested_reason || '',
    };
  } catch (e) {
    return { id, name, completed: false, is_suggestion: isSuggestion, suggested_reason: reason };
  }
};

export const updateShoppingItem = async (id, updates) => {
  if (!supabase || !isSupabaseConfigured || !id) return;
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.completed !== undefined) dbUpdates.is_checked = updates.completed;
  if (updates.is_suggestion !== undefined) dbUpdates.is_suggested = updates.is_suggestion;
  try {
    const { error } = await supabase.from('shopping_list_items').update(dbUpdates).eq('id', id);
    if (error) console.warn('[Resiboss] updateShoppingItem error:', error.message);
  } catch (err) {
    console.error('[Resiboss] updateShoppingItem exception:', err);
  }
};

export const deleteShoppingItem = async (id) => {
  return deleteShoppingItemFromSupabase(id);
};

// ==============================================================================
// AI CONVERSATIONS CRUD
// ==============================================================================

/**
 * Fetches the most recent AI conversation for the user (single active thread).
 */
export const fetchAiConversationFromSupabase = async (userId) => {
  if (!supabase || !isSupabaseConfigured || !userId) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('[Resiboss] Failed to fetch AI conversation:', err.message);
    return { data: null, error: err };
  }
};

/**
 * Upserts an AI conversation (creates or updates).
 */
export const upsertAiConversationToSupabase = async (conversation) => {
  if (!supabase || !isSupabaseConfigured) return { data: null, error: null, isLocal: true };
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .upsert([{ ...conversation, updated_at: new Date().toISOString() }], { onConflict: 'id' })
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn('[Resiboss] AI conversation sync error:', err.message);
    return { data: null, error: err };
  }
};
