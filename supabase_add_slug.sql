-- Add slug column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "slug" TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "user_slug_idx" ON "User"("slug");

-- Function to generate slug (basic version for SQL if needed, but we'll do it in JS for consistency)
-- This is just to ensure the column exists and is unique.
