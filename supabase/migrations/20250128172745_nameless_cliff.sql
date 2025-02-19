-- Function to safely delete a user and all their associated data
CREATE OR REPLACE FUNCTION public.delete_user_data(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete user's bookings
    DELETE FROM public.bookings
    WHERE user_id = user_id_param;

    -- Delete user's reviews
    DELETE FROM public.reviews
    WHERE user_id = user_id_param;

    -- Delete user's creator applications
    DELETE FROM public.creator_applications
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

    DELETE FROM public.creator_profiles
    WHERE user_id = user_id_param;

    -- Delete user's experiences
    DELETE FROM public.experience_media
    WHERE experience_id IN (
        SELECT id FROM public.experiences
        WHERE creator_id = user_id_param
    );

    DELETE FROM public.experiences
    WHERE creator_id = user_id_param;

    -- Finally, delete the user profile
    DELETE FROM public.users
    WHERE id = user_id_param;

    -- The auth.users deletion will be handled by Supabase's cascade delete
END;
$$;