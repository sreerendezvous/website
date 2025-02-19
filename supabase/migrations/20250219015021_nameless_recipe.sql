-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.approve_user_rpc(uuid, uuid);

-- Create new RPC function for user approval
CREATE OR REPLACE FUNCTION approve_user_rpc(
    user_id_param uuid,
    admin_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = admin_id_param
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
    END IF;

    -- Update user status
    UPDATE public.users
    SET 
        status = 'approved',
        updated_at = now()
    WHERE id = user_id_param;

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
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user_rpc(uuid, uuid) TO authenticated;