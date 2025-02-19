-- Function to safely update user roles
CREATE OR REPLACE FUNCTION public.update_user_role(
    user_id_param uuid,
    new_role text,
    admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify the user performing the action is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update roles';
    END IF;

    -- Verify the new role is valid
    IF new_role NOT IN ('user', 'creator', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %', new_role;
    END IF;

    -- Update the user's role
    UPDATE public.users
    SET 
        role = new_role,
        updated_at = now()
    WHERE id = user_id_param;

    -- If making user a creator, create creator profile if it doesn't exist
    IF new_role = 'creator' AND NOT EXISTS (
        SELECT 1 FROM public.creator_profiles
        WHERE user_id = user_id_param
    ) THEN
        INSERT INTO public.creator_profiles (
            user_id,
            business_name,
            approval_status
        )
        SELECT 
            user_id_param,
            u.full_name || '''s Business',
            'approved'
        FROM public.users u
        WHERE u.id = user_id_param;
    END IF;

    -- Log the action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    )
    VALUES (
        admin_id,
        'update_role',
        'user',
        user_id_param,
        jsonb_build_object(
            'new_role', new_role,
            'previous_role', (SELECT role FROM public.users WHERE id = user_id_param)
        )
    );
END;
$$;