-- Drop existing functions and triggers first
DO $$ 
BEGIN
    -- Drop trigger first
    DROP TRIGGER IF EXISTS sync_user_status_trigger ON public.users;
    -- Then drop functions
    DROP FUNCTION IF EXISTS public.approve_user(uuid, uuid);
    DROP FUNCTION IF EXISTS public.sync_user_status();
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
    auth_user_data auth.users;
BEGIN
    -- Get auth user data
    SELECT * INTO auth_user_data
    FROM auth.users
    WHERE id = user_id_param;

    IF NOT FOUND THEN
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
        -- Get or create user in public.users
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
        VALUES (
            user_id_param,
            auth_user_data.email,
            COALESCE(auth_user_data.raw_user_meta_data->>'full_name', auth_user_data.email),
            COALESCE(auth_user_data.raw_user_meta_data->>'role', 'user'),
            'approved',
            'unverified',
            now(),
            now()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            status = 'approved',
            updated_at = now()
        RETURNING * INTO result;

        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object(
                        'status', 'approved',
                        'role', COALESCE(result.role, 'user')
                    )
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
GRANT EXECUTE ON FUNCTION public.approve_user(uuid, uuid) TO authenticated;

-- Update RLS policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role')::text = 'admin'
));

CREATE POLICY "users_admin_policy"
ON public.users
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'role')::text = 'admin'
    )
);

-- Ensure admin user has correct metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object(
        'role', 'admin',
        'status', 'approved'
    )
WHERE email = 'sree@letsrendezvous.co';

-- Update public.users for admin
UPDATE public.users
SET 
    role = 'admin',
    status = 'approved'
WHERE email = 'sree@letsrendezvous.co';