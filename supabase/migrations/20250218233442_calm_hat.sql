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
    admin_user public.users;
BEGIN
    -- Get admin user data
    SELECT * INTO admin_user
    FROM public.users
    WHERE id = admin_id_param;

    IF NOT FOUND OR admin_user.role != 'admin' THEN
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
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
));

CREATE POLICY "users_admin_policy"
ON public.users
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Ensure admin user exists with correct role
DO $$
DECLARE
    admin_email text := 'sree@letsrendezvous.co';
    admin_id uuid;
BEGIN
    -- Get or create admin user
    SELECT id INTO admin_id
    FROM public.users
    WHERE email = admin_email;

    IF admin_id IS NULL THEN
        -- Create admin user if doesn't exist
        INSERT INTO public.users (
            email,
            full_name,
            role,
            status,
            verification_status
        )
        VALUES (
            admin_email,
            'Admin User',
            'admin',
            'approved',
            'verified'
        );
    ELSE
        -- Update existing user to admin
        UPDATE public.users
        SET 
            role = 'admin',
            status = 'approved',
            verification_status = 'verified'
        WHERE id = admin_id;
    END IF;
END $$;