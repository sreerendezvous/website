-- Drop existing policies
DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Create new policies without recursion
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Create admin policy using auth.users instead of public.users to avoid recursion
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

-- Update admin actions policies
DROP POLICY IF EXISTS "Admins can perform all actions" ON public.admin_actions;
CREATE POLICY "admin_actions_policy"
ON public.admin_actions
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'role')::text = 'admin'
    )
);

-- Add function to safely check admin status
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
    -- Verify admin status using is_admin function
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;