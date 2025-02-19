-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation with proper status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create user profile with pending status
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
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        'pending', -- All new users start as pending
        'unverified',
        now(),
        now()
    );

    -- Set initial metadata in auth.users
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object(
                    'status', 'pending',
                    'role', COALESCE(new.raw_user_meta_data->>'role', 'user')
                )
            ELSE 
                jsonb_set(
                    jsonb_set(
                        raw_user_meta_data,
                        '{status}',
                        '"pending"'
                    ),
                    '{role}',
                    to_jsonb(COALESCE(new.raw_user_meta_data->>'role', 'user'))
                )
        END
    WHERE id = new.id;

    RETURN new;
EXCEPTION 
    WHEN unique_violation THEN
        RETURN new;
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user status with proper sync
CREATE OR REPLACE FUNCTION update_user_status(
    user_id_param uuid,
    new_status text,
    admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = admin_id
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update user status';
    END IF;

    -- Verify valid status
    IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: must be pending, approved, or rejected';
    END IF;

    -- Update user status in both tables
    UPDATE public.users
    SET 
        status = new_status,
        updated_at = now()
    WHERE id = user_id_param;

    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('status', new_status)
            ELSE 
                jsonb_set(
                    raw_user_meta_data,
                    '{status}',
                    to_jsonb(new_status)
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
        admin_id,
        'update_status',
        'user',
        user_id_param,
        jsonb_build_object(
            'new_status', new_status,
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_status(uuid, text, uuid) TO authenticated;