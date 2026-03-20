-- NOTIFICATION TABLE SQL
-- Run this in Supabase SQL Editor to enable in-app notifications

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM_ALERT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS "idx_notification_userId" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "idx_notification_userId_isRead" ON "Notification"("userId", "isRead");

-- Allow admin full access
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
