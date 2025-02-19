-- Drop existing functions and triggers to start fresh
DO $$ 
BEGIN
    -- Drop triggers first
    DROP TRIGGER IF EXISTS on_user_status_change ON public.users;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS approve_user(uuid, uuid);
    DROP FUNCTION IF EXISTS handle_user_status_change();
    DROP FUNCTION IF EXISTS approve_creator_application(uuid, uuid);
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create function to handle user approval
CREATE OR REPLACE FUNCTION approve_user(
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

-- Create function to handle creator application approval
CREATE OR REPLACE FUNCTION approve_creator_application(
    application_id uuid,
    admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id_var uuid;
    creator_profile_id uuid;
BEGIN
    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve applications';
    END IF;

    -- Get user_id from application
    SELECT user_id INTO user_id_var
    FROM public.creator_applications
    WHERE id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Start transaction
    BEGIN
        -- Update application status
        UPDATE public.creator_applications
        SET 
            status = 'approved',
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
            updated_at = now()
        RETURNING id INTO creator_profile_id;

        -- Update user role and status
        UPDATE public.users
        SET 
            role = 'creator',
            status = 'approved',
            updated_at = now()
        WHERE id = user_id_var;

        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('role', 'creator', 'status', 'approved')
                ELSE 
                    raw_user_meta_data || 
                    jsonb_build_object('role', 'creator', 'status', 'approved')
            END
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
                'creator_profile_id', creator_profile_id,
                'timestamp', now()
            )
        );
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Failed to approve creator: %', SQLERRM;
    END;
END;
$$;

-- Create function to handle user status changes
CREATE OR REPLACE FUNCTION handle_user_status_change()
RETURNS trigger AS $$
BEGIN
    -- Only proceed if status is changing to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Update user metadata in auth.users
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('status', 'approved')
                ELSE 
                    raw_user_meta_data || jsonb_build_object('status', 'approved')
            END
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user status changes
CREATE TRIGGER on_user_status_change
    AFTER UPDATE OF status ON public.users
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION handle_user_status_change();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_creator_application(uuid, uuid) TO authenticated;

-- Update RLS policies for admin actions
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can perform all actions" ON public.admin_actions;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Admins can perform all actions"
    ON public.admin_actions
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );