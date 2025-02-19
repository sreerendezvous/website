-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_user_profile(jsonb);

-- Create new function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        status,
        verification_status,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        CASE 
            WHEN new.raw_user_meta_data->>'role' = 'creator' THEN 'pending'
            ELSE 'approved'
        END,
        'unverified',
        now(),
        now()
    );

    -- If user is a creator, create creator profile
    IF new.raw_user_meta_data->>'role' = 'creator' THEN
        INSERT INTO public.creator_profiles (
            user_id,
            business_name,
            approval_status,
            languages,
            created_at,
            updated_at
        ) VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'business_name', new.raw_user_meta_data->>'full_name'),
            'pending',
            ARRAY['English'],
            now(),
            now()
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to safely update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    profile_data jsonb,
    OUT success boolean,
    OUT error text
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    success := false;
    error := null;

    -- Verify user exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid()
    ) THEN
        error := 'User not found';
        RETURN;
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
    WHERE id = auth.uid();

    -- Update creator profile if exists
    IF EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE user_id = auth.uid()
    ) THEN
        UPDATE public.creator_profiles
        SET
            business_name = COALESCE(profile_data->>'business_name', business_name),
            languages = COALESCE((profile_data->>'languages')::text[], languages),
            updated_at = now()
        WHERE user_id = auth.uid();
    END IF;

    success := true;
END;
$$;