-- Drop trigger first to remove dependency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS public.update_user_profile(jsonb);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop all existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "users_admin_policy"
ON public.users
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Create a more permissive update function
CREATE OR REPLACE FUNCTION public.update_user_profile(
    profile_data jsonb,
    OUT success boolean,
    OUT error_message text
)
RETURNS record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    success := false;
    error_message := null;

    -- Update the user profile
    UPDATE public.users
    SET
        bio = COALESCE(profile_data->>'bio', bio),
        instagram = COALESCE(profile_data->>'instagram', instagram),
        linkedin = COALESCE(profile_data->>'linkedin', linkedin),
        other_social_links = COALESCE(profile_data->'other_social_links', other_social_links),
        interests = COALESCE((profile_data->>'interests')::text[], interests),
        languages = COALESCE((profile_data->>'languages')::text[], languages),
        location = COALESCE(profile_data->'location', location),
        updated_at = now()
    WHERE id = auth.uid();

    success := true;
EXCEPTION 
    WHEN others THEN
        error_message := SQLERRM;
END;
$$;

-- Create a resilient handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    RETURN new;
EXCEPTION 
    WHEN unique_violation THEN
        -- If there's a duplicate key error, just return the trigger
        RETURN new;
    WHEN OTHERS THEN
        -- Log other errors but don't fail the auth signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();