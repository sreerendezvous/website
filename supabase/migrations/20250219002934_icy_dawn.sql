-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "users_write_policy" ON public.users;
    DROP POLICY IF EXISTS "admin_actions_policy" ON public.admin_actions;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Create maximally permissive policies for users table
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

-- Create policy for admin_actions table
CREATE POLICY "admin_actions_policy"
ON public.admin_actions
FOR ALL
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT ALL ON public.admin_actions TO authenticated;

-- Create function to safely check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = user_id
        AND (raw_user_meta_data->>'role')::text = 'admin'
    );
$$;

-- Update approve_user function to be more permissive
CREATE OR REPLACE FUNCTION public.approve_user(
    user_id_param uuid,
    admin_id_param uuid
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.users;
BEGIN
    -- Verify admin status
    IF NOT is_admin(admin_id_param) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
    END IF;

    -- Start transaction
    BEGIN
        -- Update user status
        UPDATE public.users
        SET 
            status = 'approved',
            updated_at = now()
        WHERE id = user_id_param
        RETURNING * INTO result;

        IF NOT FOUND THEN
            -- If user doesn't exist in public.users, create them
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
            SELECT
                id,
                email,
                COALESCE(raw_user_meta_data->>'full_name', email),
                COALESCE(raw_user_meta_data->>'role', 'user'),
                'approved',
                'unverified',
                now(),
                now()
            FROM auth.users
            WHERE id = user_id_param
            RETURNING * INTO result;
        END IF;

        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('status', 'approved')
                ELSE 
                    jsonb_set(
                        raw_user_meta_data,
                        '{status}',
                        '"approved"'
                    )
            END
        WHERE id = user_id_param;

        -- Log the action
        INSERT INTO public.admin_actions (
            admin_id,
            action_type,
            target_type,
            target_id,
            details
        ) VALUES (
            admin_id_param,
            'approve',
            'user',
            user_id_param,
            jsonb_build_object(
                'timestamp', now()
            )
        );

        RETURN result;
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Failed to approve user: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user(uuid, uuid) TO authenticated;

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