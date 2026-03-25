-- ADD AUDIO SUPPORT TO JOBS
-- Run this in Supabase SQL Editor

-- 1. Add audioUrl column to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;

-- 2. Create Storage Bucket (Note: This might need to be done in the Supabase Dashboard if RLS is strict)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('diwalya-audio', 'diwalya-audio', true) ON CONFLICT (id) DO NOTHING;
