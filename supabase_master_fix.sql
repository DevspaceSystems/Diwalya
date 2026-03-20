-- =====================================================
-- DIWALYA - ONE AND FOR ALL AUDIT & FIX
-- =====================================================
-- This script cleans up triggers, fixes foreign keys, and ensures sync works perfectly.

-- 1. CLEANUP PREVIOUS TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. ENSURE ROLE ENUM EXISTS CORRECTLY
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'Role') THEN
        CREATE TYPE public."Role" AS ENUM ('CLIENT', 'WORKER', 'ADMIN', 'SUPER_ADMIN');
    END IF;
END $$;

-- 3. HARDEN THE User TABLE
CREATE TABLE IF NOT EXISTS public."User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    name TEXT NOT NULL DEFAULT 'User',
    role public."Role" NOT NULL DEFAULT 'CLIENT',
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FIX ALL FOREIGN KEYS (CRITICAL: ADD ON DELETE CASCADE TO ALL)
-- We do this so the trigger can safely DELETE stale users during sync conflicts.

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop existing problematic constraints if they exist
    FOR r IN (
        SELECT constraint_name, table_name 
        FROM information_schema.key_column_usage 
        WHERE table_schema = 'public' AND column_name IN ('userId', 'clientId', 'workerId', 'authorId', 'targetId')
    ) LOOP
        EXECUTE 'ALTER TABLE public."' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '" CASCADE;';
    END LOOP;
END $$;

-- 5. RE-ESTABLISH SAFE RELATIONSHIPS
ALTER TABLE public."WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE public."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE public."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;

-- Jobs (Very important)
ALTER TABLE public."Job" ADD CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE public."Job" ADD CONSTRAINT "Job_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public."User"(id) ON DELETE SET NULL;

-- Reviews
ALTER TABLE public."Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE public."Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public."User"(id) ON DELETE CASCADE;

-- 6. ULTIMATE SYNC TRIGGER (Simplified & Robust)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role public."Role";
    v_name text;
BEGIN
    -- 1. Determine Role (be very forgiving)
    CASE UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT'))
        WHEN 'WORKER' THEN v_role := 'WORKER'::public."Role";
        WHEN 'ADMIN' THEN v_role := 'ADMIN'::public."Role";
        WHEN 'SUPER_ADMIN' THEN v_role := 'SUPER_ADMIN'::public."Role";
        ELSE v_role := 'CLIENT'::public."Role";
    END CASE;

    -- 2. Determine Name
    v_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- 3. RESOLVE CONFLICTS (Delete any user with same email but different ID)
    -- This now works because we fixed the foreign keys above!
    DELETE FROM public."User" WHERE email = NEW.email AND id != NEW.id;

    -- 4. INSERT OR UPDATE
    INSERT INTO public."User" (id, email, name, role, "updatedAt")
    VALUES (NEW.id, NEW.email, v_name, v_role, NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "updatedAt" = NOW();

    -- 5. ENSURE WALLET
    INSERT INTO public."Wallet" (id, "userId", balance)
    VALUES ('WALLET-' || NEW.id, NEW.id, 0.0)
    ON CONFLICT ("userId") DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Register Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. REPAIR PERMISSIONS
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON public."User", public."Wallet", public."Notification" TO authenticated;
GRANT USAGE ON TYPE public."Role" TO postgres, anon, authenticated, service_role;

-- FINAL CHECK: Ensure the User table is truly RLS-disabled for the sync to work
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Wallet" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Job" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Review" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkerProfile" DISABLE ROW LEVEL SECURITY;
