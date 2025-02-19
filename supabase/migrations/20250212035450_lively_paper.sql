-- Drop existing policies
DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "admin_actions_policy" ON public.admin_actions;

-- Create function to safely check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'role')::text = 'admin'
    );
$$;

-- Create policies for users table
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
USING (is_admin());

-- Create policies for admin_actions table
CREATE POLICY "admin_actions_policy"
ON public.admin_actions
FOR ALL 
TO authenticated
USING (is_admin());

-- Update approve_user function to use is_admin function
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
BEGIN
    -- Verify admin status
    IF NOT is_admin() THEN
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
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- Create admin user if it doesn't exist
DO $$
DECLARE
    admin_email text := 'sree@letsrendezvous.co';
BEGIN
    -- Update existing user to admin if found
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('role', 'admin')
            ELSE 
                raw_user_meta_data || jsonb_build_object('role', 'admin')
        END
    WHERE email = admin_email;

    -- Update public.users table
    UPDATE public.users
    SET 
        role = 'admin',
        status = 'approved'
    WHERE email = admin_email;
END $$;