-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Experience delete policy" ON public.experiences;
    DROP POLICY IF EXISTS "Experience creation policy" ON public.experiences;
    DROP POLICY IF EXISTS "Experience view policy" ON public.experiences;
    DROP POLICY IF EXISTS "Experience update policy" ON public.experiences;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new policies with proper permissions
CREATE POLICY "experiences_read_policy"
ON public.experiences
FOR SELECT
TO public
USING (true);

CREATE POLICY "experiences_write_policy"
ON public.experiences
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "experiences_update_policy"
ON public.experiences
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "experiences_delete_policy"
ON public.experiences
FOR DELETE
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON public.experiences TO authenticated;
GRANT SELECT ON public.experiences TO anon;

-- Create function to safely delete experience
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
        SELECT 1 FROM auth.users
        WHERE id = admin_id_param
        AND (raw_user_meta_data->>'role')::text = 'admin'
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