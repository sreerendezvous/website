-- Drop existing status check constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_status_check;

-- Add new status check constraint with correct values
ALTER TABLE public.users
ADD CONSTRAINT users_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update any invalid status values to 'pending'
UPDATE public.users
SET status = 'pending'
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- Drop existing approve_user_rpc function
DROP FUNCTION IF EXISTS approve_user_rpc(uuid, uuid);

-- Create new approve_user_rpc function with better error handling
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
BEGIN
    -- Check if user exists
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE id = user_id_param
    ) INTO user_exists;

    IF NOT user_exists THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = admin_id_param
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
    END IF;

    -- Update user status
    UPDATE public.users
    SET 
        status = 'approved',
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user_rpc(uuid, uuid) TO authenticated;

-- Ensure admin user has correct status
UPDATE public.users
SET status = 'approved'
WHERE email = 'sree@letsrendezvous.co';