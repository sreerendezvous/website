-- Drop existing function
DROP FUNCTION IF EXISTS approve_user_rpc(uuid, uuid);

-- Create new approval function without any status references
CREATE OR REPLACE FUNCTION approve_user_rpc(
    user_id_param uuid,
    admin_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if admin exists and has admin role
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = admin_id_param AND role = 'admin'
    ) INTO admin_exists;

    IF NOT admin_exists THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
    END IF;

    -- Update user account_state
    UPDATE public.users
    SET 
        account_state = 'approved',
        updated_at = now()
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
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user_rpc(uuid, uuid) TO authenticated;

-- Update RLS policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_write_policy" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_write_policy"
ON public.users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;