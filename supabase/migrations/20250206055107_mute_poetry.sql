-- Drop the profile image validation trigger as it's too restrictive
DROP TRIGGER IF EXISTS ensure_profile_image ON public.users;
DROP FUNCTION IF EXISTS validate_profile_image();

-- Create a more flexible profile image validation function
CREATE OR REPLACE FUNCTION validate_profile_update()
RETURNS trigger AS $$
BEGIN
    -- Only enforce profile image requirement for approved users
    IF NEW.status = 'approved' AND NEW.profile_image IS NULL THEN
        -- Instead of raising an exception, set status back to pending
        NEW.status := 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a more flexible trigger
CREATE TRIGGER validate_profile_update
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION validate_profile_update();

-- Update storage policies to allow image uploads
DROP POLICY IF EXISTS "Media upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Media view policy" ON storage.objects;
DROP POLICY IF EXISTS "Media update policy" ON storage.objects;
DROP POLICY IF EXISTS "Media delete policy" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public viewing of media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Allow authenticated users to update own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to delete own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);