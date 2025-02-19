-- Add location column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS location jsonb DEFAULT '{}'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS users_location_city_idx ON public.users USING gin ((location->'city'));
CREATE INDEX IF NOT EXISTS users_location_country_idx ON public.users USING gin ((location->'country'));

-- Update the update_current_user function to handle location
CREATE OR REPLACE FUNCTION public.update_current_user(
    user_data jsonb
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.users;
BEGIN
    UPDATE public.users
    SET
        bio = COALESCE(user_data->>'bio', bio),
        instagram = COALESCE(user_data->>'instagram', instagram),
        linkedin = COALESCE(user_data->>'linkedin', linkedin),
        other_social_links = COALESCE(user_data->'other_social_links', other_social_links),
        interests = COALESCE((user_data->>'interests')::text[], interests),
        languages = COALESCE((user_data->>'languages')::text[], languages),
        location = COALESCE(user_data->'location', location),
        updated_at = now()
    WHERE id = auth.uid()
    RETURNING * INTO result;

    RETURN result;
END;
$$;

-- Update handle_new_user to include location
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    default_role text;
    default_status text;
BEGIN
    -- Get role from metadata or use default
    default_role := COALESCE(
        new.raw_user_meta_data->>'role',
        'user'
    );

    -- Get status based on role
    default_status := CASE
        WHEN default_role = 'creator' THEN 'pending'
        ELSE 'approved'
    END;

    -- Insert the user profile with proper error handling
    BEGIN
        -- Check if user already exists
        IF EXISTS (
            SELECT 1 FROM public.users WHERE id = new.id
        ) THEN
            RETURN new;
        END IF;

        -- Insert the user profile
        INSERT INTO public.users (
            id,
            email,
            full_name,
            role,
            status,
            verification_status,
            location,
            created_at,
            updated_at
        )
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', new.email),
            default_role,
            default_status,
            'unverified',
            '{}'::jsonb,
            now(),
            now()
        );

        -- If user is a creator, create creator profile
        IF default_role = 'creator' THEN
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
            )
            ON CONFLICT (user_id) DO NOTHING;
        END IF;

    EXCEPTION 
        WHEN unique_violation THEN
            -- If there's a duplicate key error, just return the trigger
            RETURN new;
        WHEN OTHERS THEN
            -- Log other errors but don't fail the auth signup
            RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
            RETURN new;
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;