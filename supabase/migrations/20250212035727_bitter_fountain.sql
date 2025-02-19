-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "admin_actions_policy" ON public.admin_actions;
    DROP POLICY IF EXISTS "Admins can perform all actions" ON public.admin_actions;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create simplified policies for users table
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
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
        AND (raw_user_meta_data->>'role')::text = 'admin'
    )
);

-- Create policy for admin_actions table
CREATE POLICY "admin_actions_read_policy"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_actions_write_policy"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'role')::text = 'admin'
    )
);

-- Update approve_user function to be more permissive
CREATE OR REPLACE FUNCTION approve_user(
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
    admin_meta jsonb;
BEGIN
    -- Get admin metadata
    SELECT raw_user_meta_data INTO admin_meta
    FROM auth.users
    WHERE id = admin_id_param;

    -- Verify admin status using metadata
    IF (admin_meta->>'role')::text != 'admin' THEN
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
            RAISE EXCEPTION 'User not found';
        END IF;

        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('status', 'approved')
                ELSE 
                    raw_user_meta_data || jsonb_build_object('status', 'approved')
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
                'previous_status', result.status,
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Ensure admin user exists and has proper role
DO $$
DECLARE
    admin_email text := 'sree@letsrendezvous.co';
BEGIN
    -- Update auth.users
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('role', 'admin', 'status', 'approved')
            ELSE 
                raw_user_meta_data || 
                jsonb_build_object('role', 'admin', 'status', 'approved')
        END
    WHERE email = admin_email;

    -- Update public.users
    UPDATE public.users
    SET 
        role = 'admin',
        status = 'approved'
    WHERE email = admin_email;
END $$;