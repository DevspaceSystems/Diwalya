-- ANTI-BYPASS AND CHAT SCHEMA
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "isFlagged" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster chat retrieval
CREATE INDEX IF NOT EXISTS idx_chat_jobid ON "ChatMessage"("jobId");

-- Row Level Security Disabling
ALTER TABLE "ChatMessage" DISABLE ROW LEVEL SECURITY;

-- Add Warning system to User if not already there (handled in full_fix but double checking)
-- ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER DEFAULT 0;
-- ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN DEFAULT FALSE;
