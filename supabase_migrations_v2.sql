-- ==============================================================================
-- RESIBOSS 2.0 — DATABASE MIGRATIONS
-- Run this entire script in your Supabase SQL editor.
-- Safe to run multiple times (uses IF NOT EXISTS and DROP IF EXISTS).
-- ==============================================================================

-- ==============================================================================
-- STEP 1: FIX CRITICAL RLS (was USING(true) — allowed any user to read all data)
-- ==============================================================================
DROP POLICY IF EXISTS "Allow all operations on receipts" ON public.receipts;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.receipts;
DROP POLICY IF EXISTS "Allow public read access to receipts" ON public.receipts;
DROP POLICY IF EXISTS "Allow public insert and update access to receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users access their own receipts" ON public.receipts;

CREATE POLICY "Users access their own receipts"
  ON public.receipts
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Keep anon read access disabled (only authenticated users may access receipts)
REVOKE ALL ON TABLE public.receipts FROM anon;
GRANT ALL ON TABLE public.receipts TO authenticated, service_role;

-- ==============================================================================
-- STEP 2: ADD NEW COLUMNS TO RECEIPTS TABLE
-- ==============================================================================
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS discount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS notes TEXT;

-- New index for receipt_number lookups (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts (receipt_number);

-- ==============================================================================
-- STEP 3: SHOPPING LIST ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT DEFAULT '1',
  is_checked BOOLEAN DEFAULT false,
  is_suggested BOOLEAN DEFAULT false,
  suggested_reason TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their shopping list" ON public.shopping_list_items;
CREATE POLICY "Users own their shopping list"
  ON public.shopping_list_items
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

GRANT ALL ON TABLE public.shopping_list_items TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_shopping_user_id ON public.shopping_list_items (user_id);

DROP TRIGGER IF EXISTS trg_shopping_list_updated_at ON public.shopping_list_items;
CREATE TRIGGER trg_shopping_list_updated_at
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- STEP 4: AI CONVERSATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New conversation',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their AI conversations" ON public.ai_conversations;
CREATE POLICY "Users own their AI conversations"
  ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

GRANT ALL ON TABLE public.ai_conversations TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_ai_conv_user_id ON public.ai_conversations (user_id);

DROP TRIGGER IF EXISTS trg_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER trg_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- STEP 5: UPDATE ACCOUNT DELETION FUNCTION TO INCLUDE NEW TABLES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_to_delete text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    target_id uuid;
    target_email text;
    deleted_receipts_count int := 0;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        target_id := auth.uid();
    ELSIF user_id_to_delete IS NOT NULL AND user_id_to_delete <> '' THEN
        BEGIN
            target_id := user_id_to_delete::uuid;
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid user UUID format');
        END;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'No user ID provided');
    END IF;

    SELECT email INTO target_email FROM auth.users WHERE id = target_id;

    -- Delete receipts
    WITH del_receipts AS (
        DELETE FROM public.receipts
        WHERE user_id = target_id::text
           OR (target_email IS NOT NULL AND LOWER(user_email) = LOWER(target_email))
        RETURNING id
    )
    SELECT count(*) INTO deleted_receipts_count FROM del_receipts;

    -- Delete shopping list
    DELETE FROM public.shopping_list_items WHERE user_id = target_id::text;

    -- Delete AI conversations
    DELETE FROM public.ai_conversations WHERE user_id = target_id::text;

    -- Delete auth records
    DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = target_id);
    DELETE FROM auth.mfa_challenges WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = target_id);
    DELETE FROM auth.mfa_factors WHERE user_id = target_id;
    BEGIN
        DELETE FROM auth.one_time_tokens WHERE user_id = target_id;
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
    DELETE FROM auth.identities WHERE user_id = target_id;
    DELETE FROM auth.sessions WHERE user_id = target_id;
    BEGIN
        DELETE FROM auth.users WHERE id = target_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', true,
            'deleted_user_id', target_id,
            'deleted_receipts', deleted_receipts_count,
            'note', 'Data purged. Auth user retained or managed externally.'
        );
    END;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_user_id', target_id,
        'deleted_receipts', deleted_receipts_count
    );
END;
$$;

GRANT ALL ON FUNCTION public.delete_user_account(text) TO authenticated, service_role;

-- ==============================================================================
-- STEP 6: REFRESH SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
