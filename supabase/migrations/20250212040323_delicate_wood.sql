-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation with pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user already exists
    IF EXISTS (
        SELECT 1 FROM public.users WHERE id = new.id
    ) THEN
        RETURN new;
    END IF;

    -- Insert the user profile with pending status
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
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        'user', -- Everyone starts as a regular user
        'pending', -- All users start as pending
        'unverified',
        now(),
        now()
    );

    -- Log new user signup
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        new.id, -- Use the user's own ID since there's no admin yet
        'signup',
        'user',
        new.id,
        jsonb_build_object(
            'email', new.email,
            'timestamp', now()
        )
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update approve_user function to be more robust
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

        -- Log the approval action
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
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Update RLS policies
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
DROP POLICY IF EXISTS "admin_actions_policy" ON public.admin_actions;

-- Create simplified policies
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

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

CREATE POLICY "admin_actions_policy"
ON public.admin_actions
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'role')::text = 'admin'
    )
);