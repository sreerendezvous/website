-- Drop existing functions first
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.approve_user(uuid, uuid);
END $$;

-- Create function to handle user approval with better error handling
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
    user_exists boolean;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id_param
    ) INTO user_exists;

    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found in auth system';
    END IF;

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
            -- If user doesn't exist in public.users, create them
            INSERT INTO public.users (
                id,
                email,
                full_name,
                role,
                status,
                verification_status,
                created_at,
                updated_at
            )
            SELECT
                id,
                email,
                COALESCE(raw_user_meta_data->>'full_name', email),
                COALESCE(raw_user_meta_data->>'role', 'user'),
                'approved',
                'unverified',
                now(),
                now()
            FROM auth.users
            WHERE id = user_id_param
            RETURNING * INTO result;
        END IF;

        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('status', 'approved')
                ELSE 
                    jsonb_set(
                        raw_user_meta_data,
                        '{status}',
                        '"approved"'
                    )
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.approve_user(uuid, uuid) TO authenticated;

-- Add trigger to sync user status between auth.users and public.users
CREATE OR REPLACE FUNCTION sync_user_status()
RETURNS trigger AS $$
BEGIN
    -- Update auth.users metadata when public.users status changes
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('status', NEW.status)
                ELSE 
                    jsonb_set(
                        raw_user_meta_data,
                        '{status}',
                        to_jsonb(NEW.status)
                    )
            END
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status sync
DROP TRIGGER IF EXISTS sync_user_status_trigger ON public.users;
CREATE TRIGGER sync_user_status_trigger
    AFTER UPDATE OF status ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_status();