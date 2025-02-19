-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "admin_actions_read_policy" ON public.admin_actions;
    DROP POLICY IF EXISTS "admin_actions_write_policy" ON public.admin_actions;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'role')::text = 'admin'
    );
$$;

-- Create simplified policies for users table
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
USING (auth.uid() = id OR is_admin());

CREATE POLICY "users_admin_policy"
ON public.users
FOR ALL
USING (is_admin());

-- Create policies for admin_actions table
CREATE POLICY "admin_actions_read_policy"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_actions_write_policy"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Update approve_user function to be more resilient
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
    admin_meta jsonb;
BEGIN
    -- Get admin metadata with retry logic
    FOR i IN 1..3 LOOP -- Try up to 3 times
        BEGIN
            SELECT raw_user_meta_data INTO admin_meta
            FROM auth.users
            WHERE id = admin_id_param;
            
            EXIT WHEN admin_meta IS NOT NULL;
            
            -- Wait 100ms before retrying
            PERFORM pg_sleep(0.1);
        EXCEPTION
            WHEN others THEN
                IF i = 3 THEN RAISE; END IF;
        END;
    END LOOP;

    -- Verify admin status using metadata
    IF (admin_meta->>'role')::text != 'admin' THEN
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

        -- Update auth.users metadata with retry logic
        FOR i IN 1..3 LOOP -- Try up to 3 times
            BEGIN
                UPDATE auth.users
                SET raw_user_meta_data = 
                    CASE 
                        WHEN raw_user_meta_data IS NULL THEN 
                            jsonb_build_object('status', 'approved')
                        ELSE 
                            raw_user_meta_data || jsonb_build_object('status', 'approved')
                    END
                WHERE id = user_id_param;
                
                EXIT;
            EXCEPTION
                WHEN others THEN
                    IF i = 3 THEN RAISE; END IF;
                    PERFORM pg_sleep(0.1);
            END;
        END LOOP;

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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Ensure admin user exists and has proper role
DO $$
DECLARE
    admin_email text := 'sree@letsrendezvous.co';
BEGIN
    -- Update auth.users with retry logic
    FOR i IN 1..3 LOOP
        BEGIN
            UPDATE auth.users
            SET raw_user_meta_data = 
                CASE 
                    WHEN raw_user_meta_data IS NULL THEN 
                        jsonb_build_object('role', 'admin', 'status', 'approved')
                    ELSE 
                        raw_user_meta_data || 
                        jsonb_build_object('role', 'admin', 'status', 'approved')
                END
            WHERE email = admin_email;
            
            EXIT;
        EXCEPTION
            WHEN others THEN
                IF i = 3 THEN RAISE; END IF;
                PERFORM pg_sleep(0.1);
        END;
    END LOOP;

    -- Update public.users
    UPDATE public.users
    SET 
        role = 'admin',
        status = 'approved'
    WHERE email = admin_email;
END $$;