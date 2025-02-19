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
CREATE POLICY "Allow public viewing of media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] IN ('profile-images', 'experience-media')
);

CREATE POLICY "Allow authenticated users to update own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Allow authenticated users to delete own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND
    auth.uid()::text = (storage.foldername(name))[2]
);

-- Update the update_user_profile function to handle profile image updates
CREATE OR REPLACE FUNCTION public.update_user_profile(
    profile_data jsonb
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate profile image URL if provided
    IF profile_data->>'profile_image' IS NOT NULL THEN
        IF NOT (profile_data->>'profile_image' LIKE 'https://%' OR profile_data->>'profile_image' LIKE 'http://%') THEN
            RAISE EXCEPTION 'Invalid profile image URL';
        END IF;
    END IF;

    RETURN QUERY
    UPDATE public.users
    SET
        bio = COALESCE(profile_data->>'bio', bio),
        instagram = COALESCE(profile_data->>'instagram', instagram),
        linkedin = COALESCE(profile_data->>'linkedin', linkedin),
        other_social_links = COALESCE(profile_data->'other_social_links', other_social_links),
        interests = COALESCE((profile_data->>'interests')::text[], interests),
        languages = COALESCE((profile_data->>'languages')::text[], languages),
        location = COALESCE(profile_data->'location', location),
        profile_image = COALESCE(profile_data->>'profile_image', profile_image),
        updated_at = now()
    WHERE id = auth.uid()
    RETURNING *;
END;
$$;