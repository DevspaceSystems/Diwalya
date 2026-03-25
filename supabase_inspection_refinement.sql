-- INSPECTION FLOW REFINEMENT
-- Run this in Supabase SQL Editor

-- 1. Add scheduling and accompaniment columns to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "inspectionScheduledAt" TIMESTAMPTZ;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "accompanyingMemberId" TEXT;

-- 2. Add new job status if not already there (though we use existing ones mostly)
-- No new status needed for now, we'll use IN_PROGRESS and metadata for scheduled/completed.
