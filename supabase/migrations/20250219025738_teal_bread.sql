-- Drop existing delete_user_data function
DROP FUNCTION IF EXISTS public.delete_user_data(uuid);

-- Create new delete_user_data function with proper cascade order
CREATE OR REPLACE FUNCTION public.delete_user_data(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete message delivery records first
    DELETE FROM public.message_delivery
    WHERE message_id IN (
        SELECT id FROM public.messages
        WHERE conversation_id IN (
            SELECT id FROM public.conversations
            WHERE creator_id = user_id_param OR user_id = user_id_param
        )
    );

    -- Delete message reactions
    DELETE FROM public.message_reactions
    WHERE message_id IN (
        SELECT id FROM public.messages
        WHERE conversation_id IN (
            SELECT id FROM public.conversations
            WHERE creator_id = user_id_param OR user_id = user_id_param
        )
    );

    -- Delete message read status
    DELETE FROM public.message_read_status
    WHERE message_id IN (
        SELECT id FROM public.messages
        WHERE conversation_id IN (
            SELECT id FROM public.conversations
            WHERE creator_id = user_id_param OR user_id = user_id_param
        )
    );

    -- Delete messages
    DELETE FROM public.messages
    WHERE conversation_id IN (
        SELECT id FROM public.conversations
        WHERE creator_id = user_id_param OR user_id = user_id_param
    );

    -- Delete conversations
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_data(uuid) TO authenticated;