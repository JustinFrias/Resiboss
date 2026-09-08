-- ==============================================================================
-- RESIBOSS SUPABASE DATABASE SCHEMA
-- Copy and paste this script directly into Supabase: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create Receipts & Audit Invoices Table
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

-- 2. Safe Migration (Run this if you already created the receipts table previously)
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 3. Create Performance Indexes for Fast Filtering & Account Isolation
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.receipts (date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_merchant ON public.receipts (merchant);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON public.receipts (category);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts (status);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts (user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_email ON public.receipts (user_email);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- 5. Create Access Policies (Allow read and write operations via API Anon Key)
DROP POLICY IF EXISTS "Allow public read access to receipts" ON public.receipts;
CREATE POLICY "Allow public read access to receipts" 
ON public.receipts 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow public insert and update access to receipts" ON public.receipts;
CREATE POLICY "Allow public insert and update access to receipts" 
ON public.receipts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 6. Auto-update 'updated_at' column on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_receipts_updated_at ON public.receipts;
CREATE TRIGGER trg_receipts_updated_at
BEFORE UPDATE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Supabase Realtime Broadcasting for receipts table
-- This allows instant multi-device live sync whenever receipts are inserted, updated, or deleted
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

-- 8. Secure Account Deletion Function (Permanently deletes account and receipts from Supabase)
DROP FUNCTION IF EXISTS public.delete_user_account();
DROP FUNCTION IF EXISTS public.delete_user_account(text);

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
    -- Prefer active session auth.uid(), fallback to passed user_id_to_delete
    IF auth.uid() IS NOT NULL THEN
        target_id := auth.uid();
    ELSIF user_id_to_delete IS NOT NULL AND user_id_to_delete <> '' THEN
        BEGIN
            target_id := user_id_to_delete::uuid;
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid user UUID format');
        END;
    ELSE
        RAISE EXCEPTION 'Not authenticated and no user ID provided';
    END IF;

    -- Lookup user email to purge any receipts linked by email
    SELECT email INTO target_email FROM auth.users WHERE id = target_id;

    -- 1. Delete all receipts uploaded by this user
    WITH del_receipts AS (
        DELETE FROM public.receipts 
        WHERE user_id = target_id::text 
           OR (target_email IS NOT NULL AND LOWER(user_email) = LOWER(target_email))
        RETURNING id
    )
    SELECT count(*) INTO deleted_receipts_count FROM del_receipts;

    -- 2. Clean up child auth records first to prevent foreign key constraints
    DELETE FROM auth.identities WHERE user_id = target_id;
    DELETE FROM auth.sessions WHERE user_id = target_id;

    -- 3. Delete user from auth.users
    DELETE FROM auth.users WHERE id = target_id;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_user_id', target_id,
        'deleted_receipts', deleted_receipts_count
    );
END;
$$;

-- Grant execution to authenticated, anon, and service_role
GRANT EXECUTE ON FUNCTION public.delete_user_account(text) TO anon, authenticated, service_role;


