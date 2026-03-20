-- DIWALYA ROBUST SCHEMA Fix
-- Run this in the Supabase SQL Editor

-- 1. ENUMS (Safe Creation)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('CLIENT', 'WORKER', 'ADMIN', 'SUPER_ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationStatus') THEN
        CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobStatus') THEN
        CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ADMIN_REVIEW', 'WORKER_REVIEW', 'RESCHEDULE_REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobType') THEN
        CREATE TYPE "JobType" AS ENUM ('REGULAR', 'INSPECTION');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WithdrawalStatus') THEN
        CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WithdrawalMethod') THEN
        CREATE TYPE "WithdrawalMethod" AS ENUM ('MOMO', 'BANK');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionType') THEN
        CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionPurpose') THEN
        CREATE TYPE "TransactionPurpose" AS ENUM ('JOB_PAYMENT', 'WITHDRAWAL', 'PLATFORM_FEE', 'REFUND', 'INSPECTION_FEE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityType') THEN
        CREATE TYPE "ActivityType" AS ENUM ('REGISTRATION', 'BOOKING_REQUEST', 'BOOKING_ACCEPTED', 'BOOKING_REJECTED', 'PAYMENT_COMPLETED', 'WALLET_WITHDRAWAL', 'REPORT_SUBMITTED', 'VERIFICATION_REQUEST', 'VERIFICATION_APPROVED', 'SYSTEM_ALERT', 'ADMIN_ACTION');
    END IF;
END $$;

-- 2. TABLES (Safe Creation)

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "phone" TEXT UNIQUE,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" DEFAULT 'CLIENT',
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "fcmToken" TEXT,
    "isSuspended" BOOLEAN DEFAULT FALSE,
    "isBanned" BOOLEAN DEFAULT FALSE,
    "warningCount" INTEGER DEFAULT 0,
    "suspensionReason" TEXT
);

CREATE TABLE IF NOT EXISTS "WorkerProfile" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "category" TEXT NOT NULL,
    "bio" TEXT,
    "experienceYears" INTEGER DEFAULT 0,
    "location" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION,
    "isVerified" BOOLEAN DEFAULT FALSE,
    "availability" TEXT,
    "portfolioImages" TEXT[],
    "portfolioVideos" TEXT[],
    "businessName" TEXT,
    "ghanaCardUrl" TEXT,
    "rejectionReason" TEXT,
    "verificationStatus" "VerificationStatus" DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "balance" DOUBLE PRECISION DEFAULT 0.0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT PRIMARY KEY,
    "walletId" TEXT NOT NULL REFERENCES "Wallet"("id") ON DELETE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "purpose" "TransactionPurpose" NOT NULL,
    "reference" TEXT UNIQUE,
    "status" TEXT DEFAULT 'SUCCESS',
    "metadata" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT PRIMARY KEY,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'GHS',
    "status" TEXT NOT NULL,
    "reference" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL REFERENCES "User"("id"),
    "workerId" TEXT NOT NULL REFERENCES "User"("id"),
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" "JobStatus" DEFAULT 'PENDING',
    "type" "JobType" DEFAULT 'REGULAR',
    "priceAmount" DOUBLE PRECISION,
    "assignedTeamMember" TEXT,
    "inspectionWorkerAmount" DOUBLE PRECISION,
    "inspectionAdminAmount" DOUBLE PRECISION,
    "isInspectionVerified" BOOLEAN DEFAULT FALSE,
    "inspectionNotes" TEXT,
    "workerConfirmedAt" TIMESTAMP WITH TIME ZONE,
    "adminVerifiedAt" TIMESTAMP WITH TIME ZONE,
    "paymentId" TEXT REFERENCES "Payment"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT PRIMARY KEY,
    "jobId" TEXT UNIQUE NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "authorId" TEXT NOT NULL REFERENCES "User"("id"),
    "targetId" TEXT NOT NULL REFERENCES "User"("id"),
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "WithdrawalStatus" DEFAULT 'PENDING',
    "method" "WithdrawalMethod" NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "adminNotified" BOOLEAN DEFAULT FALSE,
    "processedAt" TIMESTAMP WITH TIME ZONE,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "type" "ActivityType" NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "inspectionFee" DOUBLE PRECISION DEFAULT 100.0,
    "inspectionWorkerShare" DOUBLE PRECISION DEFAULT 60.0,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AdminToken" (
    "id" TEXT PRIMARY KEY,
    "token" TEXT UNIQUE NOT NULL,
    "email" TEXT,
    "isUsed" BOOLEAN DEFAULT FALSE,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS DISABLING
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkerProfile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "WithdrawalRequest" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminToken" DISABLE ROW LEVEL SECURITY;
