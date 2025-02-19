-- Create function to update user role without changing status
CREATE OR REPLACE FUNCTION update_user_role(
    user_id_param uuid,
    new_role text,
    admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_status text;
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM public.users
    WHERE id = user_id_param;

    -- Update user role while preserving status
    UPDATE public.users
    SET 
        role = new_role,
        updated_at = now()
    WHERE id = user_id_param;

    -- If changing to creator role, create creator profile if it doesn't exist
    IF new_role = 'creator' THEN
        INSERT INTO public.creator_profiles (
            user_id,
            business_name,
            approval_status,
            languages,
            created_at,
            updated_at
        )
        SELECT
            user_id_param,
            u.full_name || '''s Business',
            'approved',
            ARRAY['English'],
            now(),
            now()
        FROM public.users u
        WHERE u.id = user_id_param
        ON CONFLICT (user_id) 
        DO UPDATE SET
            updated_at = now();
    END IF;

    -- Log the action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        admin_id,
        'update_role',
        'user',
        user_id_param,
        jsonb_build_object(
            'new_role', new_role,
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text, uuid) TO authenticated;