-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation
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

    -- Insert the user profile with approved status by default
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
        'approved', -- Auto-approve all users
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to grant creator status
CREATE OR REPLACE FUNCTION grant_creator_status(
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
        RAISE EXCEPTION 'Unauthorized: Only admins can grant creator status';
    END IF;

    -- Start transaction
    BEGIN
        -- Update user role
        UPDATE public.users
        SET 
            role = 'creator',
            updated_at = now()
        WHERE id = user_id_param
        RETURNING * INTO result;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'User not found';
        END IF;

        -- Create creator profile
        INSERT INTO public.creator_profiles (
            user_id,
            business_name,
            approval_status,
            languages,
            created_at,
            updated_at
        )
        VALUES (
            user_id_param,
            result.full_name || '''s Business',
            'approved',
            ARRAY['English'],
            now(),
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            approval_status = 'approved',
            updated_at = now();

        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('role', 'creator')
                ELSE 
                    raw_user_meta_data || jsonb_build_object('role', 'creator')
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
            'grant_creator',
            'user',
            user_id_param,
            jsonb_build_object(
                'previous_role', result.role,
                'timestamp', now()
            )
        );

        RETURN result;
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Failed to grant creator status: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION grant_creator_status(uuid, uuid) TO authenticated;

-- Update existing users to approved status
UPDATE public.users
SET status = 'approved'
WHERE status = 'pending';

-- Clean up unused tables and columns
DROP TABLE IF EXISTS public.creator_applications;