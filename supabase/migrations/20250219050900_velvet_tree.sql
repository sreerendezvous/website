-- Create function to update user status
CREATE OR REPLACE FUNCTION update_user_status(
    user_id_param uuid,
    new_status text,
    admin_id uuid
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
        WHERE id = admin_id
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update user status';
    END IF;

    -- Verify valid status
    IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: must be pending, approved, or rejected';
    END IF;

    -- Update user status
    UPDATE public.users
    SET 
        status = new_status,
        updated_at = now()
    WHERE id = user_id_param;

    -- Update auth.users metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('status', new_status)
            ELSE 
                jsonb_set(
                    raw_user_meta_data,
                    '{status}',
                    to_jsonb(new_status)
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
        admin_id,
        'update_status',
        'user',
        user_id_param,
        jsonb_build_object(
            'new_status', new_status,
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_status(uuid, text, uuid) TO authenticated;