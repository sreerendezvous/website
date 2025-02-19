-- Create function to handle user approval in a transaction
CREATE OR REPLACE FUNCTION approve_user(
    user_id_param uuid,
    admin_id_param uuid
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.users;
BEGIN
    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = admin_id_param AND role = 'admin'
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

        -- If any of the above fails, the entire transaction will be rolled back
        RETURN result;
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Failed to approve user: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;

-- Add trigger to handle user status changes
CREATE OR REPLACE FUNCTION handle_user_status_change()
RETURNS trigger AS $$
BEGIN
    -- Only proceed if status is changing to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Update user metadata in auth.users
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            raw_user_meta_data,
            '{status}',
            '"approved"'
        )
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user status changes
DROP TRIGGER IF EXISTS on_user_status_change ON public.users;
CREATE TRIGGER on_user_status_change
    AFTER UPDATE OF status ON public.users
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION handle_user_status_change();