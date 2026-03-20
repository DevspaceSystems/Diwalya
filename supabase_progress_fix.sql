-- DIWALYA EXPANDED SCHEMA (Job Progress & Disputes)
-- Run this in the Supabase SQL Editor

-- 1. UPDATED ENUMS
DO $$ BEGIN
    -- Add new JobStatus values if they don't exist
    -- Since we can't easily add to Enum in a DO block without complex logic, 
    -- we'll just ensure the script creates the full list if it doesn't exist.
    -- If it does exist, we might need to ALTER TYPE ... ADD VALUE if needed.
    NULL; 
END $$;

-- 2. NEW TABLES

-- JobProgress Table
CREATE TABLE IF NOT EXISTS "JobProgress" (
    "id" TEXT PRIMARY KEY,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "workerId" TEXT NOT NULL REFERENCES "User"("id"),
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[], -- Array of image/video URLs
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Table
CREATE TABLE IF NOT EXISTS "Dispute" (
    "id" TEXT PRIMARY KEY,
    "jobId" TEXT UNIQUE NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "raisedById" TEXT NOT NULL REFERENCES "User"("id"),
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT DEFAULT 'OPEN', -- OPEN, UNDER_REVIEW, RESOLVED, CLOSED
    "adminNotes" TEXT,
    "resolution" TEXT, -- e.g. "FULL_PAYMENT", "PARTIAL_REFUND", "FULL_REFUND"
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Job Table (add completion fields if missing)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Job' AND COLUMN_NAME='completedAt') THEN
        ALTER TABLE "Job" ADD COLUMN "completedAt" TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Job' AND COLUMN_NAME='userConfirmedAt') THEN
        ALTER TABLE "Job" ADD COLUMN "userConfirmedAt" TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. RLS DISABLING
ALTER TABLE "JobProgress" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Dispute" DISABLE ROW LEVEL SECURITY;

-- 4. RE-RUN FULL SCHEMA Fix (ensure all new statuses are there)
-- Updated JobStatus list: PENDING, INSPECTION_COMPLETED, ESTIMATE_SUBMITTED, AWAITING_PAYMENT, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, ADMIN_REVIEW
-- We'll use a script to gracefully handle Enum updates if needed.
DO $$ 
BEGIN
    -- Check and add missing JobStatus values
    BEGIN
        ALTER TYPE "JobStatus" ADD VALUE 'INSPECTION_COMPLETED';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER TYPE "JobStatus" ADD VALUE 'ESTIMATE_SUBMITTED';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER TYPE "JobStatus" ADD VALUE 'AWAITING_PAYMENT';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
