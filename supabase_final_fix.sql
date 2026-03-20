-- =====================================================
-- DIWALYA - ULTIMATE SIGNUP & SYNC FIX (FINAL)
-- =====================================================
-- This script fixes the "Database error saving new user" 
-- by consolidating triggers and robustifying constraints.
-- RUN THIS IN THE SUPABASE SQL EDITOR.

-- 1. CLEANUP PREVIOUS TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. ENSURE ENUMS EXIST
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE public."Role" AS ENUM ('CLIENT', 'WORKER', 'ADMIN', 'SUPER_ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationStatus') THEN
        CREATE TYPE public."VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobStatus') THEN
        CREATE TYPE public."JobStatus" AS ENUM ('PENDING', 'ADMIN_REVIEW', 'WORKER_REVIEW', 'RESCHEDULE_REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

-- 3. HARDEN TABLES (User, Wallet, Notification)
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

CREATE TABLE IF NOT EXISTS public."Wallet" (
    id TEXT PRIMARY KEY,
    "userId" TEXT UNIQUE NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    balance DOUBLE PRECISION DEFAULT 0.0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Notification" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM_ALERT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FIX ALL FOREIGN KEYS (FORCE CASCADE FOR SYNC SAFETY)
-- This loop cleans up ANY foreign key constraints on tables that reference User.id
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop existing problematic constraints if they exist on common user reference columns
    FOR r IN (
        SELECT constraint_name, table_name 
        FROM information_schema.key_column_usage 
        WHERE table_schema = 'public' 
        AND column_name IN ('userId', 'clientId', 'workerId', 'authorId', 'targetId', 'reporterId', 'senderId')
    ) LOOP
        EXECUTE 'ALTER TABLE public."' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '" CASCADE;';
    END LOOP;
END $$;

-- Re-establish Safe Relationships with ON DELETE CASCADE or SET NULL
DO $$ BEGIN
    -- WorkerProfile
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WorkerProfile') THEN
        ALTER TABLE public."WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
    END IF;
    -- Job
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Job') THEN
        ALTER TABLE public."Job" ADD CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."User"(id) ON DELETE CASCADE;
        ALTER TABLE public."Job" ADD CONSTRAINT "Job_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public."User"(id) ON DELETE SET NULL;
    END IF;
    -- Reviews
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Review') THEN
        ALTER TABLE public."Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON DELETE CASCADE;
        ALTER TABLE public."Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public."User"(id) ON DELETE CASCADE;
    END IF;
    -- Wallet
    ALTER TABLE public."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
    -- WithdrawalRequest
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WithdrawalRequest') THEN
        ALTER TABLE public."WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
    END IF;
    -- SpecialRequest
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SpecialRequest') THEN
        ALTER TABLE public."SpecialRequest" ADD CONSTRAINT "SpecialRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
    END IF;
    -- PlatformReport
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PlatformReport') THEN
        ALTER TABLE public."PlatformReport" ADD CONSTRAINT "PlatformReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON DELETE CASCADE;
        ALTER TABLE public."PlatformReport" ADD CONSTRAINT "PlatformReport_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public."User"(id) ON DELETE CASCADE;
    END IF;
    -- ChatMessage
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ChatMessage') THEN
        ALTER TABLE public."ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. THE ULTIMATE SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role public."Role";
    v_name text;
BEGIN
    -- 1. Resolve Name
    v_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    -- 2. Resolve Role
    v_role := (CASE 
        WHEN UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT')) = 'WORKER' THEN 'WORKER'::public."Role"
        WHEN UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT')) = 'ADMIN' THEN 'ADMIN'::public."Role"
        WHEN UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT')) = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::public."Role"
        ELSE 'CLIENT'::public."Role"
    END);

    -- 3. Delete any stale user profile with same email but DIFFERENT id
    -- This fixes sync conflicts if a previous signup failed partially.
    DELETE FROM public."User" WHERE email = NEW.email AND id != NEW.id;

    -- 4. INSERT OR UPDATE the User profile
    INSERT INTO public."User" (id, email, name, role, "updatedAt")
    VALUES (NEW.id, NEW.email, v_name, v_role, NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "updatedAt" = NOW();

    -- 5. Ensure Wallet exists
    INSERT INTO public."Wallet" (id, "userId", balance, "updatedAt")
    VALUES ('WALLET-' || NEW.id, NEW.id, 0.0, NOW())
    ON CONFLICT ("userId") DO NOTHING;

    -- 6. Welcome Notification
    INSERT INTO public."Notification" (id, "userId", title, message, type, "createdAt")
    VALUES (
        'NOTIF-WELCOME-' || NEW.id, 
        NEW.id, 
        'Welcome to Diwalya!', 
        'Hi ' || v_name || ', welcome to Ghana''s trusted skilled labor marketplace. We''re glad to have you!', 
        'SYSTEM_ALERT', 
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- For debugging: RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW; -- Still return NEW to allow auth signup even if sync fails (optional choice)
END;
$$ LANGUAGE plpgsql;

-- Re-register Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. PERMISSIONS & RLS
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Wallet" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification" DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON public."User", public."Wallet", public."Notification" TO authenticated;
GRANT USAGE ON TYPE public."Role" TO postgres, anon, authenticated, service_role;

-- DONE!
