-- Drop all existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON public.users;
    DROP POLICY IF EXISTS "Allow self update" ON public.users;
    DROP POLICY IF EXISTS "Allow admin access" ON public.users;
    DROP POLICY IF EXISTS "Public read access" ON public.users;
    DROP POLICY IF EXISTS "Self insert access" ON public.users;
    DROP POLICY IF EXISTS "Self update access" ON public.users;
    DROP POLICY IF EXISTS "Admin full access" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create base policies for public access
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

-- Create policy for authenticated users to update their own profile
CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy for admins to manage all users
CREATE POLICY "users_admin_policy"
ON public.users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Grant necessary permissions
GRANT SELECT ON public.users TO anon;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Update the update_current_user function to be more permissive
CREATE OR REPLACE FUNCTION public.update_current_user(
    user_data jsonb
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.users;
BEGIN
    -- Verify the user exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Update the user profile
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

-- Update handle_new_user function to be more resilient
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;