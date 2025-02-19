-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation with auto-approval
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create user profile with approved status by default
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
        'approved', -- Auto-approve all users
        'unverified',
        now(),
        now()
    );

    -- Update auth.users metadata to include approved status
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

-- Update all existing users to approved status
UPDATE public.users 
SET status = 'approved' 
WHERE status != 'approved';

-- Update auth.users metadata for all existing users
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
    END;

-- Ensure admin user has correct role and metadata
DO $$
DECLARE
    admin_email text := 'sree@letsrendezvous.co';
    admin_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = admin_email;

    IF admin_id IS NOT NULL THEN
        -- Update auth.users metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            jsonb_build_object(
                'role', 'admin',
                'status', 'approved'
            )
        WHERE id = admin_id;

        -- Update public.users
        INSERT INTO public.users (
            id,
            email,
            full_name,
            role,
            status,
            verification_status
        )
        VALUES (
            admin_id,
            admin_email,
            'Admin User',
            'admin',
            'approved',
            'verified'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'admin',
            status = 'approved',
            verification_status = 'verified';
    END IF;
END $$;