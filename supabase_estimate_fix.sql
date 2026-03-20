-- JOB ESTIMATE SCHEMA
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "JobEstimate" (
    "id" TEXT PRIMARY KEY,
    "jobId" TEXT UNIQUE NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "workerId" TEXT NOT NULL REFERENCES "User"("id"),
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "estimatedDays" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT DEFAULT 'PENDING_ADMIN_REVIEW',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Disabling
ALTER TABLE "JobEstimate" DISABLE ROW LEVEL SECURITY;
