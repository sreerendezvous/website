-- Add profile image column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_image text;

-- Add profile image validation function
CREATE OR REPLACE FUNCTION validate_profile_image()
RETURNS trigger AS $$
BEGIN
    IF NEW.profile_image IS NULL THEN
        RAISE EXCEPTION 'Profile image is required';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile image validation
DROP TRIGGER IF EXISTS ensure_profile_image ON public.users;
CREATE TRIGGER ensure_profile_image
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION validate_profile_image();

-- Update the update_user_profile function to handle profile image
CREATE OR REPLACE FUNCTION public.update_user_profile(
    profile_data jsonb
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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