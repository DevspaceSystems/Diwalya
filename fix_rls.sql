-- 1. Enable RLS on the storage bucket if not already enabled
-- (Usually handled via the UI, but this ensures focus)

-- 2. Allow Public/Authenticated Uploads to 'diwalya-media'
-- This policy allows any authenticated user to upload files to the bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'diwalya-media');

-- 3. Allow Public/Authenticated Select (to view images)
CREATE POLICY "Allow authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'diwalya-media');

-- 4. Allow users to Update/Delete their OWN files
CREATE POLICY "Allow users to manage own files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'diwalya-media' AND owner = auth.uid());

-- NOTE: If you want anyone (even non-logged in users) to see the images, 
-- you should make the bucket "Public" in the Supabase Dashboard settings for 'diwalya-media'.
