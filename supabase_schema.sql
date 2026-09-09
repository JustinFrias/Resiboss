-- ==============================================================================
-- RESIBOSS OFFICIAL DATABASE SCHEMA (CLEAN, ROBUST & COMPLETE)
-- ==============================================================================
-- Table: public.receipts
-- Purpose: Stores all scanned receipts, invoice breakdowns, VAT, and user accounts
-- ==============================================================================

-- 1. Create Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY,
    merchant TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TEXT DEFAULT '12:00 PM',
    tin TEXT DEFAULT '000-000-000-000',
    category TEXT DEFAULT 'Food',
    payment_method TEXT DEFAULT 'Cash',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    vat NUMERIC(12, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'PHP',
    confidence NUMERIC(5, 2) DEFAULT 99.80,
    raw_ocr_text TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Verified',
    image_uri TEXT,
    user_id TEXT,
    user_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure all columns exist (safe migration for existing databases)
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS time TEXT DEFAULT '12:00 PM';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS tin TEXT DEFAULT '000-000-000-000';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Food';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS vat NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS total NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PHP';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS confidence NUMERIC(5, 2) DEFAULT 99.80;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Verified';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS image_uri TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create Performance Indexes for Fast Queries
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.receipts (date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_merchant ON public.receipts (merchant);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON public.receipts (category);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts (status);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts (user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_email ON public.receipts (user_email);

-- 4. Enable Row Level Security (RLS) & Set Simple App Access Policy
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on receipts" ON public.receipts;
DROP POLICY IF EXISTS "Allow public read access to receipts" ON public.receipts;
DROP POLICY IF EXISTS "Allow public insert and update access to receipts" ON public.receipts;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.receipts;

CREATE POLICY "Allow all operations on receipts" 
ON public.receipts 
FOR ALL 
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.receipts TO anon, authenticated, service_role;

-- 5. Auto-Update 'updated_at' Timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receipts_updated_at ON public.receipts;
CREATE TRIGGER trg_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Realtime Sync for Receipts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'receipts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
    END IF;
END $$;

-- 7. Account Deletion RPC Function (Permanent Account & Receipt Purge)
DROP FUNCTION IF EXISTS public.delete_user_account() CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_account(text) CASCADE;

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
    -- 1. Identify Target User
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

    -- Lookup user email
    SELECT email INTO target_email FROM auth.users WHERE id = target_id;

    -- 2. Delete User's Receipts
    WITH del_receipts AS (
        DELETE FROM public.receipts 
        WHERE user_id = target_id::text 
           OR (target_email IS NOT NULL AND LOWER(user_email) = LOWER(target_email))
        RETURNING id
    )
    SELECT count(*) INTO deleted_receipts_count FROM del_receipts;

    -- 3. Delete Auth Child Records in FK order
    DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = target_id);
    DELETE FROM auth.mfa_challenges WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = target_id);
    DELETE FROM auth.mfa_factors WHERE user_id = target_id;
    
    BEGIN
        DELETE FROM auth.one_time_tokens WHERE user_id = target_id;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    DELETE FROM auth.identities WHERE user_id = target_id;
    DELETE FROM auth.sessions WHERE user_id = target_id;

    -- 4. Delete Auth User
    BEGIN
        DELETE FROM auth.users WHERE id = target_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', true,
            'deleted_user_id', target_id,
            'deleted_receipts', deleted_receipts_count,
            'note', 'Receipts purged. Auth user retained or managed externally.'
        );
    END;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_user_id', target_id,
        'deleted_receipts', deleted_receipts_count
    );
END;
$$;

GRANT ALL ON FUNCTION public.delete_user_account(text) TO anon, authenticated, service_role;

-- 8. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
