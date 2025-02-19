-- Drop trigger first, then function
DROP TRIGGER IF EXISTS on_user_status_change ON public.users CASCADE;
DROP FUNCTION IF EXISTS handle_user_status_change() CASCADE;
DROP FUNCTION IF EXISTS approve_user(uuid, uuid) CASCADE;

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
    admin_role text;
BEGIN
    -- Get admin role directly from users table
    SELECT role INTO admin_role
    FROM public.users
    WHERE id = admin_id_param;

    -- Verify admin status
    IF admin_role != 'admin' THEN
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
CREATE POLICY "users_admin_policy"
ON public.users
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);