-- Create content-files storage bucket if it doesn't exist
-- Run this in Supabase SQL Editor

-- Enable storage extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-files', 'content-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS Policy: Allow public to read/download files
CREATE POLICY "Allow public read on content-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-files');

-- RLS Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload on content-files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-files'
  AND auth.role() = 'authenticated'
);

-- RLS Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated update on content-files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-files'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'content-files'
  AND auth.role() = 'authenticated'
);

-- RLS Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete on content-files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-files'
  AND auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
