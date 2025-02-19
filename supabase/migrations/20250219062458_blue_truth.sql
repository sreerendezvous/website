-- Drop existing function
DROP FUNCTION IF EXISTS approve_user_rpc(uuid, uuid);

-- Create updated function using account_state
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
    user_exists boolean;
    admin_role text;
BEGIN
    -- Check if user exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id_param
    ) INTO user_exists;

    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Get admin role from app_meta_data
    SELECT raw_app_meta_data->>'role' INTO admin_role
    FROM auth.users
    WHERE id = admin_id_param;

    IF admin_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
    END IF;

    -- Start transaction
    BEGIN
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
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user_rpc(uuid, uuid) TO authenticated;