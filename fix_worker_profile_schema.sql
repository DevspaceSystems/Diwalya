-- 1. Fix WorkerProfile schema
ALTER TABLE "WorkerProfile" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create ProgressUpdate table for Step-by-Step job tracking
CREATE TABLE IF NOT EXISTS "ProgressUpdate" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create SupportTicket table for Reports & Issues
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "jobId" TEXT REFERENCES "Job"("id") ON DELETE SET NULL,
    "category" TEXT NOT NULL, -- e.g. 'USER_REPORT', 'JOB_ISSUE', 'PAYMENT_ISSUE'
    "description" TEXT NOT NULL,
    "status" TEXT DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Modify ChatMessage to allow NULL jobId for Admin-Worker direct chats
ALTER TABLE "ChatMessage" ALTER COLUMN "jobId" DROP NOT NULL;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_progress_update_jobId" ON "ProgressUpdate"("jobId");
CREATE INDEX IF NOT EXISTS "idx_support_ticket_userId" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "idx_chat_message_senderId" ON "ChatMessage"("senderId");

-- 6. Disable RLS for new tables (following project pattern)
ALTER TABLE "ProgressUpdate" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" DISABLE ROW LEVEL SECURITY;
