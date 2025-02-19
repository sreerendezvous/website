-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation with proper error handling
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON public.users;
    DROP POLICY IF EXISTS "Allow self insert" ON public.users;
    DROP POLICY IF EXISTS "Allow self update" ON public.users;
    DROP POLICY IF EXISTS "Allow admin access" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create simplified policies
CREATE POLICY "Allow public read access"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow self update"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin access"
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
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;