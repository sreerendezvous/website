-- Drop existing functions
DROP FUNCTION IF EXISTS approve_user_rpc(uuid, uuid);
DROP FUNCTION IF EXISTS delete_user_data(uuid);

-- Create new approval function without status references
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

-- Create new delete function with proper cascade order
CREATE OR REPLACE FUNCTION delete_user_data(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete booking requests first
    DELETE FROM public.booking_requests
    WHERE user_id = user_id_param;

    -- Delete booking requests for user's experiences
    DELETE FROM public.booking_requests
    WHERE experience_id IN (
        SELECT id FROM public.experiences
        WHERE creator_id = user_id_param
    );

    -- Delete messages and conversations
    DELETE FROM public.messages
    WHERE conversation_id IN (
        SELECT id FROM public.conversations
        WHERE creator_id = user_id_param OR user_id = user_id_param
    );

    DELETE FROM public.conversations
    WHERE creator_id = user_id_param OR user_id = user_id_param;

    -- Delete experience media
    DELETE FROM public.experience_media
    WHERE experience_id IN (
        SELECT id FROM public.experiences
        WHERE creator_id = user_id_param
    );

    -- Delete experiences
    DELETE FROM public.experiences
    WHERE creator_id = user_id_param;

    -- Delete creator profile
    DELETE FROM public.creator_profiles
    WHERE user_id = user_id_param;

    -- Delete bookings
    DELETE FROM public.bookings
    WHERE user_id = user_id_param;

    -- Delete reviews
    DELETE FROM public.reviews
    WHERE user_id = user_id_param;

    -- Delete admin actions
    DELETE FROM public.admin_actions
    WHERE admin_id = user_id_param OR target_id = user_id_param;

    -- Finally delete the user
    DELETE FROM public.users
    WHERE id = user_id_param;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_user_rpc(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data(uuid) TO authenticated;