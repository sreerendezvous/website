-- Rename status column to account_state
ALTER TABLE public.users
RENAME COLUMN status TO account_state;

-- Update the check constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE public.users
ADD CONSTRAINT users_account_state_check 
CHECK (account_state IN ('pending', 'approved', 'rejected'));

-- Update functions to use new column name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        account_state,
        verification_status,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        'pending',
        'unverified',
        now(),
        now()
    );

    RETURN new;
EXCEPTION 
    WHEN unique_violation THEN
        RETURN new;
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$;

-- Update approve_user_rpc function
CREATE OR REPLACE FUNCTION approve_user_rpc(
    user_id_param uuid,
    admin_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_exists boolean;
    admin_role text;
BEGIN
    -- Check if user exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id_param
    ) INTO user_exists;

    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Get admin role from app_meta_data
    SELECT raw_app_meta_data->>'role' INTO admin_role
    FROM auth.users
    WHERE id = admin_id_param;

    IF admin_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
    END IF;

    -- Start transaction
    BEGIN
        -- Update user account_state
        UPDATE public.users
        SET 
            account_state = 'approved',
            updated_at = now()
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
                'timestamp', now()
            )
        );
    END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user_rpc(uuid, uuid) TO authenticated;