-- Drop existing delete_user_data function
DROP FUNCTION IF EXISTS public.delete_user_data(uuid);

-- Create new function with proper cascade delete order
CREATE OR REPLACE FUNCTION public.delete_user_data(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete messages and conversations first
    DELETE FROM public.messages
    WHERE conversation_id IN (
        SELECT id FROM public.conversations
        WHERE creator_id = user_id_param OR user_id = user_id_param
    );

    DELETE FROM public.conversations
    WHERE creator_id = user_id_param OR user_id = user_id_param;

    -- Delete experience media before experiences
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

    -- Delete creator applications
    DELETE FROM public.creator_applications
    WHERE user_id = user_id_param;

    -- Delete creator verifications
    DELETE FROM public.creator_verifications
    WHERE creator_id IN (
        SELECT id FROM public.creator_profiles
        WHERE user_id = user_id_param
    );

    -- Delete bookings
    DELETE FROM public.bookings
    WHERE user_id = user_id_param;

    -- Delete reviews
    DELETE FROM public.reviews
    WHERE user_id = user_id_param;

    -- Finally delete the user
    DELETE FROM public.users
    WHERE id = user_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_data(uuid) TO authenticated;

-- Add ON DELETE CASCADE to foreign keys
ALTER TABLE public.experiences
DROP CONSTRAINT IF EXISTS experiences_creator_profile_id_fkey,
ADD CONSTRAINT experiences_creator_profile_id_fkey
    FOREIGN KEY (creator_profile_id)
    REFERENCES public.creator_profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.experiences
DROP CONSTRAINT IF EXISTS experiences_creator_id_fkey,
ADD CONSTRAINT experiences_creator_id_fkey
    FOREIGN KEY (creator_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;