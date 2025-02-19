-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.delete_experience_rpc(uuid);

-- Create new function to delete experience
CREATE OR REPLACE FUNCTION delete_experience_rpc(
    experience_id_param uuid,
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
        SELECT 1 FROM public.users
        WHERE id = admin_id_param AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete experiences';
    END IF;

    -- Delete experience media first
    DELETE FROM public.experience_media
    WHERE experience_id = experience_id_param;

    -- Delete the experience
    DELETE FROM public.experiences
    WHERE id = experience_id_param;

    -- Log the action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        admin_id_param,
        'delete',
        'experience',
        experience_id_param,
        jsonb_build_object(
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_experience_rpc(uuid, uuid) TO authenticated;