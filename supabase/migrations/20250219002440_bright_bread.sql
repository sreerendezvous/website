-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "users_write_policy" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create maximally permissive policies
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_write_policy"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Ensure admin user exists with correct role
DO $$
DECLARE
    admin_email text := 'sree@letsrendezvous.co';
    admin_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = admin_email;

    IF admin_id IS NOT NULL THEN
        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            jsonb_build_object(
                'role', 'admin',
                'status', 'approved'
            )
        WHERE id = admin_id;

        -- Update public.users
        INSERT INTO public.users (
            id,
            email,
            full_name,
            role,
            status,
            verification_status
        )
        VALUES (
            admin_id,
            admin_email,
            'Admin User',
            'admin',
            'approved',
            'verified'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'admin',
            status = 'approved',
            verification_status = 'verified';
    END IF;
END $$;