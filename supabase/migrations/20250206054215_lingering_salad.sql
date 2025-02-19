-- Drop existing policies and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_user_profile(jsonb);

-- Recreate the handle_new_user function with proper permissions
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
        RETURN new;
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Disable and re-enable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_admin_policy" ON public.users;

-- Create new policies with proper permissions
CREATE POLICY "users_select_policy" 
ON public.users 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "users_update_policy" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR 
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = auth.users.id
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "users_insert_policy" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id OR 
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = auth.users.id
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "users_delete_policy" 
ON public.users 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = auth.users.id
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- Create a secure function to update user profiles
CREATE OR REPLACE FUNCTION public.update_user_profile(
    profile_data jsonb
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.users;
BEGIN
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
    WHERE id = auth.uid()
    RETURNING * INTO result;

    RETURN result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_user_profile(jsonb) TO authenticated;