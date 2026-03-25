-- Create Love table
CREATE TABLE IF NOT EXISTS "Love" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "targetId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("userId", "targetId")
);

-- Disable RLS for Love table (consistent with the rest of the schema)
ALTER TABLE "Love" DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for Review and Love tables
BEGIN;
  -- Remove existing publication if any (to avoid duplicates)
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create publication for all tables or specific ones
  -- Note: In managed Supabase, this is often already set up. 
  -- We just need to add the tables to the 'supabase_realtime' publication.
  CREATE PUBLICATION supabase_realtime FOR TABLE "Review", "Love";
COMMIT;

-- Note: In the Supabase Dashboard, you might also need to check the "Realtime" 
-- toggle for these tables in the Replication settings if the above doesn't work.
