-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view approved creator profiles" ON public.creator_profiles;
DROP POLICY IF EXISTS "Creators can view own profile" ON public.creator_profiles;
DROP POLICY IF EXISTS "Creators can update own profile" ON public.creator_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.creator_profiles;

-- Recreate policies with proper permissions
CREATE POLICY "Anyone can view approved creator profiles"
    ON public.creator_profiles
    FOR SELECT
    USING (approval_status = 'approved');

CREATE POLICY "Creators can view own profile"
    ON public.creator_profiles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Creators can update own profile"
    ON public.creator_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Creators can insert own profile"
    ON public.creator_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
    ON public.creator_profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add function to safely update creator profile
CREATE OR REPLACE FUNCTION public.update_creator_profile(
    creator_id uuid,
    profile_data jsonb
)
RETURNS public.creator_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.creator_profiles;
BEGIN
    -- Verify the user is updating their own profile or is an admin
    IF NOT (
        creator_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Update or insert the profile
    INSERT INTO public.creator_profiles (
        user_id,
        business_name,
        languages,
        specialties,
        social_links,
        cover_image,
        profile_image,
        updated_at
    )
    VALUES (
        creator_id,
        profile_data->>'business_name',
        COALESCE((profile_data->>'languages')::text[], ARRAY['English']::text[]),
        COALESCE((profile_data->>'specialties')::text[], ARRAY[]::text[]),
        COALESCE(profile_data->'social_links', '{}'::jsonb),
        profile_data->>'cover_image',
        profile_data->>'profile_image',
        now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        business_name = EXCLUDED.business_name,
        languages = EXCLUDED.languages,
        specialties = EXCLUDED.specialties,
        social_links = EXCLUDED.social_links,
        cover_image = EXCLUDED.cover_image,
        profile_image = EXCLUDED.profile_image,
        updated_at = EXCLUDED.updated_at
    RETURNING * INTO result;

    RETURN result;
END;
$$;