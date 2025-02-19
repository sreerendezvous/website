-- Drop existing storage policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Media public read access" ON storage.objects;
    DROP POLICY IF EXISTS "Media upload access" ON storage.objects;
    DROP POLICY IF EXISTS "Media update access" ON storage.objects;
    DROP POLICY IF EXISTS "Media delete access" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Ensure media bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Create simplified storage policies
CREATE POLICY "Media read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Media write access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'profile-images'
);

CREATE POLICY "Media update access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'profile-images'
);

CREATE POLICY "Media delete access"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'profile-images'
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;