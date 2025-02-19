-- Drop existing storage policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Media read access" ON storage.objects;
    DROP POLICY IF EXISTS "Media write access" ON storage.objects;
    DROP POLICY IF EXISTS "Media update access" ON storage.objects;
    DROP POLICY IF EXISTS "Media delete access" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Ensure media bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Create maximally permissive storage policies for authenticated users
CREATE POLICY "Media read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Media write access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Media update access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

CREATE POLICY "Media delete access"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Ensure proper bucket configuration
UPDATE storage.buckets
SET public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'media';