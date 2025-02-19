-- User profiles schema
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    bio text,
    interests text[],
    languages text[],
    location jsonb,
    social_profiles jsonb[],
    preferences jsonb,
    verification_status text DEFAULT 'unverified',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view approved profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        verification_status = 'verified' OR 
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Function to update profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    profile_data jsonb
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.user_profiles;
BEGIN
    -- Verify user is updating their own profile
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Insert or update profile
    INSERT INTO public.user_profiles (
        user_id,
        bio,
        interests,
        languages,
        location,
        social_profiles,
        preferences,
        updated_at
    )
    VALUES (
        auth.uid(),
        profile_data->>'bio',
        COALESCE((profile_data->>'interests')::text[], ARRAY[]::text[]),
        COALESCE((profile_data->>'languages')::text[], ARRAY['English']::text[]),
        COALESCE(profile_data->'location', '{}'::jsonb),
        COALESCE(profile_data->'social_profiles', '[]'::jsonb),
        COALESCE(profile_data->'preferences', '{}'::jsonb),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        bio = EXCLUDED.bio,
        interests = EXCLUDED.interests,
        languages = EXCLUDED.languages,
        location = EXCLUDED.location,
        social_profiles = EXCLUDED.social_profiles,
        preferences = EXCLUDED.preferences,
        updated_at = EXCLUDED.updated_at
    RETURNING * INTO result;

    RETURN result;
END;
$$;

-- Add trigger to create profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

-- Add indexes for better query performance
CREATE INDEX user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX user_profiles_verification_status_idx ON public.user_profiles(verification_status);
CREATE INDEX user_profiles_languages_idx ON public.user_profiles USING gin(languages);
CREATE INDEX user_profiles_interests_idx ON public.user_profiles USING gin(interests);