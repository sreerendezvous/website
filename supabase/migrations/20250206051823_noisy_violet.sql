-- Add social links columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS other_social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified'::text,
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT ARRAY['English']::text[];

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS users_verification_status_idx ON public.users(verification_status);
CREATE INDEX IF NOT EXISTS users_languages_idx ON public.users USING gin(languages);
CREATE INDEX IF NOT EXISTS users_interests_idx ON public.users USING gin(interests);

-- Update existing users with default values
UPDATE public.users
SET 
    other_social_links = '{}'::jsonb,
    verification_status = 'unverified',
    interests = ARRAY[]::text[],
    languages = ARRAY['English']::text[]
WHERE other_social_links IS NULL;

-- Add RLS policies for social links
CREATE POLICY "Users can update own social links"
    ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Function to safely update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_id uuid,
    profile_data jsonb
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.users;
BEGIN
    -- Verify the user is updating their own profile
    IF NOT (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Update the user profile
    UPDATE public.users
    SET
        bio = COALESCE(profile_data->>'bio', bio),
        instagram = COALESCE(profile_data->>'instagram', instagram),
        linkedin = COALESCE(profile_data->>'linkedin', linkedin),
        other_social_links = COALESCE(profile_data->'other_social_links', other_social_links),
        interests = COALESCE((profile_data->>'interests')::text[], interests),
        languages = COALESCE((profile_data->>'languages')::text[], languages),
        updated_at = now()
    WHERE id = user_id
    RETURNING * INTO result;

    RETURN result;
END;
$$;