-- =====================================================
-- DIWALYA - COMPREHENSIVE SECURITY & RLS FIX
-- =====================================================
-- This script enables Row Level Security (RLS) on all public tables
-- and defines access policies to protect sensitive data.
-- RUN THIS IN THE SUPABASE SQL EDITOR.

-- 0. HELPER FUNCTION: Check if user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role IN ('ADMIN', 'SUPER_ADMIN')
    FROM public."User"
    WHERE id = auth.uid()::text
  );
END;
$$;

-- 1. ENABLE RLS ON ALL TABLES
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'PartialPayout', 'ProgressUpdate', 'SupportTicket', 'Notification', 
            'SystemSettings', 'SpecialRequest', 'PlatformReport', 'trigger_logs', 
            'Transaction', 'Payment', 'WithdrawalRequest', 'ActivityLog', 
            'ChatMessage', 'Wallet', 'Love', 'AdminToken', 'Review', 'Job', 
            'WorkerProfile', 'User', 'JobProgress', 'Dispute', 
            'admin_credentials', 'JobEstimate'
        )
    ) LOOP
        EXECUTE 'ALTER TABLE public."' || r.tablename || '" ENABLE ROW LEVEL SECURITY;';
        -- Drop existing versions of our security policies to allow re-runs
        EXECUTE 'DROP POLICY IF EXISTS "Admin full access" ON public."' || r.tablename || '";';
        EXECUTE 'DROP POLICY IF EXISTS "Enable all access for admins" ON public."' || r.tablename || '";';
    END LOOP;
END $$;

-- 2. GLOBAL ADMIN POLICY
-- Allows Admins/Super-Admins full access to all managed tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'PartialPayout', 'ProgressUpdate', 'SupportTicket', 'Notification', 
            'SystemSettings', 'SpecialRequest', 'PlatformReport', 'trigger_logs', 
            'Transaction', 'Payment', 'WithdrawalRequest', 'ActivityLog', 
            'ChatMessage', 'Wallet', 'Love', 'AdminToken', 'Review', 'Job', 
            'WorkerProfile', 'User', 'JobProgress', 'Dispute', 
            'admin_credentials', 'JobEstimate'
        )
    ) LOOP
        EXECUTE 'CREATE POLICY "Admin full access" ON public."' || r.tablename || '" FOR ALL TO authenticated USING (public.is_admin());';
    END LOOP;
END $$;

-- 3. SPECIFIC USER POLICIES

-- User Profile: Public Read, Owner Update
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public."User";
CREATE POLICY "Users are viewable by everyone" ON public."User" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can update own record" ON public."User";
CREATE POLICY "Users can update own record" ON public."User" FOR UPDATE TO authenticated USING (auth.uid()::text = id);

-- WorkerProfile: Public Read, Owner Update
DROP POLICY IF EXISTS "Worker profiles are viewable by everyone" ON public."WorkerProfile";
CREATE POLICY "Worker profiles are viewable by everyone" ON public."WorkerProfile" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Workers can update own profile" ON public."WorkerProfile";
CREATE POLICY "Workers can update own profile" ON public."WorkerProfile" FOR UPDATE TO authenticated USING (auth.uid()::text = "userId");

-- Wallet: Owner Only
DROP POLICY IF EXISTS "Users can view own wallet" ON public."Wallet";
CREATE POLICY "Users can view own wallet" ON public."Wallet" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");

-- Transaction: Owner Only (via Wallet)
DROP POLICY IF EXISTS "Users can view own transactions" ON public."Transaction";
CREATE POLICY "Users can view own transactions" ON public."Transaction" FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public."Wallet" WHERE id = "walletId" AND "userId" = auth.uid()::text));

-- Job & JobEstimate: Participants Only (Client or Worker)
DROP POLICY IF EXISTS "Participants can view jobs" ON public."Job";
CREATE POLICY "Participants can view jobs" ON public."Job" FOR SELECT TO authenticated 
USING (auth.uid()::text = "clientId" OR auth.uid()::text = "workerId");
DROP POLICY IF EXISTS "Participants can update jobs" ON public."Job";
CREATE POLICY "Participants can update jobs" ON public."Job" FOR UPDATE TO authenticated 
USING (auth.uid()::text = "clientId" OR auth.uid()::text = "workerId");

DROP POLICY IF EXISTS "Participants can view estimates" ON public."JobEstimate";
CREATE POLICY "Participants can view estimates" ON public."JobEstimate" FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public."Job" WHERE id = "jobId" AND (auth.uid()::text = "clientId" OR auth.uid()::text = "workerId")));

-- Progress & Payouts: Participants Only
DROP POLICY IF EXISTS "Participants can view progress" ON public."JobProgress";
CREATE POLICY "Participants can view progress" ON public."JobProgress" FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public."Job" WHERE id = "jobId" AND (auth.uid()::text = "clientId" OR auth.uid()::text = "workerId")));
DROP POLICY IF EXISTS "Participants can view updates" ON public."ProgressUpdate";
CREATE POLICY "Participants can view updates" ON public."ProgressUpdate" FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public."Job" WHERE id = "jobId" AND (auth.uid()::text = "clientId" OR auth.uid()::text = "workerId")));
DROP POLICY IF EXISTS "Participants can view payouts" ON public."PartialPayout";
CREATE POLICY "Participants can view payouts" ON public."PartialPayout" FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public."Job" WHERE id = "jobId" AND (auth.uid()::text = "clientId" OR auth.uid()::text = "workerId")));

-- ChatMessage: Sender or Recipient Only
DROP POLICY IF EXISTS "Users can view own messages" ON public."ChatMessage";
CREATE POLICY "Users can view own messages" ON public."ChatMessage" FOR SELECT TO authenticated 
USING (auth.uid()::text = "senderId" OR auth.uid()::text = "recipientId");
DROP POLICY IF EXISTS "Users can insert own messages" ON public."ChatMessage";
CREATE POLICY "Users can insert own messages" ON public."ChatMessage" FOR INSERT TO authenticated 
WITH CHECK (auth.uid()::text = "senderId");

-- Notification: Recipient Only
DROP POLICY IF EXISTS "Users can view own notifications" ON public."Notification";
CREATE POLICY "Users can view own notifications" ON public."Notification" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Users can update own notifications" ON public."Notification";
CREATE POLICY "Users can update own notifications" ON public."Notification" FOR UPDATE TO authenticated USING (auth.uid()::text = "userId");

-- Review: Public Read, Author Write
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public."Review";
CREATE POLICY "Reviews are viewable by everyone" ON public."Review" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authors can insert reviews" ON public."Review";
CREATE POLICY "Authors can insert reviews" ON public."Review" FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = "authorId");

-- Support & Reports: Reporter Only
DROP POLICY IF EXISTS "Reporters can view own tickets" ON public."SupportTicket";
CREATE POLICY "Reporters can view own tickets" ON public."SupportTicket" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
DROP POLICY IF EXISTS "Reporters can view own reports" ON public."PlatformReport";
CREATE POLICY "Reporters can view own reports" ON public."PlatformReport" FOR SELECT TO authenticated USING (auth.uid()::text = "reporterId");
DROP POLICY IF EXISTS "Reporters can view own requests" ON public."SpecialRequest";
CREATE POLICY "Reporters can view own requests" ON public."SpecialRequest" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");

-- Financial Requests: Owner Only
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public."WithdrawalRequest";
CREATE POLICY "Users can view own withdrawals" ON public."WithdrawalRequest" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");

-- Love (Likes/Favorites): Public Read, Owner Write
DROP POLICY IF EXISTS "Loves are viewable by everyone" ON public."Love";
CREATE POLICY "Loves are viewable by everyone" ON public."Love" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage own loves" ON public."Love";
CREATE POLICY "Users can manage own loves" ON public."Love" FOR ALL TO authenticated USING (auth.uid()::text = "userId");

-- 4. RESTRICT SENSITIVE TABLES (Admin Only - No User Policies)
-- Tables like AdminToken, admin_credentials, SystemSettings already have the Admin policy from step 2.
-- We ensure no other policies exist for them.
