-- Drop existing delete_user_data function
DROP FUNCTION IF EXISTS public.delete_user_data(uuid);

-- Create new delete_user_data function without creator_applications dependency
CREATE OR REPLACE FUNCTION public.delete_user_data(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete user's bookings
    DELETE FROM public.bookings
    WHERE user_id = user_id_param;

    -- Delete user's reviews
    DELETE FROM public.reviews
    WHERE user_id = user_id_param;

    -- Delete user's creator profile and associated data
    DELETE FROM public.creator_verifications
    WHERE creator_id IN (
        SELECT id FROM public.creator_profiles
        WHERE user_id = user_id_param
    );

    DELETE FROM public.creator_specialties
    WHERE creator_id IN (
        SELECT id FROM public.creator_profiles
        WHERE user_id = user_id_param
    );

    -- Delete user's experiences and media
    DELETE FROM public.experience_media
    WHERE experience_id IN (
        SELECT id FROM public.experiences
        WHERE creator_id = user_id_param
    );

    DELETE FROM public.experiences
    WHERE creator_id = user_id_param;

    -- Delete creator profile
    DELETE FROM public.creator_profiles
    WHERE user_id = user_id_param;

    -- Delete user's messages and conversations
    DELETE FROM public.messages
    WHERE conversation_id IN (
        SELECT id FROM public.conversations
        WHERE creator_id = user_id_param OR user_id = user_id_param
    );

    DELETE FROM public.conversations
    WHERE creator_id = user_id_param OR user_id = user_id_param;

    -- Finally, delete the user profile
    DELETE FROM public.users
    WHERE id = user_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_data(uuid) TO authenticated;