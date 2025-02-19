-- Enable storage for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Policy to allow authenticated users to upload media
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow public access to media
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Policy to allow creators to delete their own media
CREATE POLICY "Creators can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);