-- Drop existing function if it exists
DROP FUNCTION IF EXISTS approve_creator_application(uuid, uuid);

-- Create new function with correct parameters
CREATE OR REPLACE FUNCTION approve_creator_application(
    application_id uuid,
    admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id_var uuid;
BEGIN
    -- Get user_id from application
    SELECT user_id INTO user_id_var
    FROM public.creator_applications
    WHERE id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Update application status
    UPDATE public.creator_applications
    SET status = 'approved',
        reviewed_by = admin_id,
        reviewed_at = now()
    WHERE id = application_id;

    -- Create or update creator profile
    INSERT INTO public.creator_profiles (
        user_id,
        business_name,
        approval_status,
        languages,
        created_at,
        updated_at
    )
    SELECT
        user_id_var,
        COALESCE(
            (SELECT business_name FROM public.creator_profiles WHERE user_id = user_id_var),
            (SELECT full_name FROM public.users WHERE id = user_id_var) || '''s Business'
        ),
        'approved',
        ARRAY['English'],
        now(),
        now()
    ON CONFLICT (user_id) 
    DO UPDATE SET
        approval_status = 'approved',
        updated_at = now();

    -- Update user role and status
    UPDATE public.users
    SET 
        role = 'creator',
        status = 'approved',
        updated_at = now()
    WHERE id = user_id_var;

    -- Log the action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        admin_id,
        'approve',
        'creator',
        user_id_var,
        jsonb_build_object(
            'application_id', application_id,
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_creator_application(uuid, uuid) TO authenticated;