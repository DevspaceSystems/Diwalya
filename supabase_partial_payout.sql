-- PARTIAL PAYOUT SCHEMA
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "PartialPayout" (
    "id" TEXT PRIMARY KEY,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "adminId" TEXT NOT NULL REFERENCES "User"("id"),
    "workerId" TEXT NOT NULL REFERENCES "User"("id"),
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Disabling
ALTER TABLE "PartialPayout" DISABLE ROW LEVEL SECURITY;
