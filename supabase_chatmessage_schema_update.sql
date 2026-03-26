-- Migration to add recipientId to ChatMessage
-- This allows direct messaging between users (or admin) without requiring an active Job
ALTER TABLE "public"."ChatMessage" ADD COLUMN IF NOT EXISTS "recipientId" TEXT;

-- Drop the NOT NULL constraint on jobId, because direct messages will not have a jobId
ALTER TABLE "public"."ChatMessage" ALTER COLUMN "jobId" DROP NOT NULL;

-- Add foreign key constraint to link recipientId to the User table
ALTER TABLE "public"."ChatMessage" 
  ADD CONSTRAINT "ChatMessage_recipientId_fkey" 
  FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
