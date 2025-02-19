-- Drop existing storage policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public viewing of media" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update own media" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete own media" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Ensure media bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies with proper permissions
CREATE POLICY "Media public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Media upload access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'profile-images' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Media update access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'profile-images' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Media delete access"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'profile-images' AND
    (storage.foldername(name))[2] = auth.uid()::text
);