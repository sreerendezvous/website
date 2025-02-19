-- Drop existing functions first
DO $$ 
DECLARE
    _sql text;
BEGIN
    -- Drop functions if they exist
    DROP FUNCTION IF EXISTS public.approve_user(uuid, uuid);
    DROP FUNCTION IF EXISTS public.delete_experience(uuid, uuid);
END $$;

-- Create function to handle user approval
CREATE OR REPLACE FUNCTION public.approve_user(
    user_id_param uuid,
    admin_id_param uuid
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result public.users;
BEGIN
    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = admin_id_param
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
    END IF;

    -- Start transaction
    BEGIN
        -- Update user status
        UPDATE public.users
        SET 
            status = 'approved',
            updated_at = now()
        WHERE id = user_id_param
        RETURNING * INTO result;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'User not found';
        END IF;

        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('status', 'approved')
                ELSE 
                    raw_user_meta_data || jsonb_build_object('status', 'approved')
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
                'previous_status', result.status,
                'timestamp', now()
            )
        );

        RETURN result;
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Failed to approve user: %', SQLERRM;
    END;
END;
$$;

-- Create function to delete experience
CREATE OR REPLACE FUNCTION public.delete_experience(
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
        SELECT 1 FROM auth.users
        WHERE id = admin_id_param
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete experiences';
    END IF;

    -- Start transaction
    BEGIN
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
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Failed to delete experience: %', SQLERRM;
    END;
END;
$$;

-- Update RLS policies for experiences
DROP POLICY IF EXISTS "Experience delete policy" ON public.experiences;
CREATE POLICY "Experience delete policy"
ON public.experiences
FOR DELETE
USING (
    creator_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'role')::text = 'admin'
    )
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.approve_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_experience(uuid, uuid) TO authenticated;