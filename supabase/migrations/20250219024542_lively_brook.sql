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
DECLARE
    meta_status text;
    meta_role text;
BEGIN
    -- Get status and role from metadata if they exist
    meta_status := COALESCE(new.raw_user_meta_data->>'status', 'approved');
    meta_role := COALESCE(new.raw_user_meta_data->>'role', 'user');

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
        meta_role,
        meta_status,
        'unverified',
        now(),
        now()
    );

    -- Ensure auth.users metadata matches
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object(
                    'status', meta_status,
                    'role', meta_role
                )
            ELSE 
                jsonb_set(
                    jsonb_set(
                        raw_user_meta_data,
                        '{status}',
                        to_jsonb(meta_status)
                    ),
                    '{role}',
                    to_jsonb(meta_role)
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

-- Create trigger to sync status changes
CREATE OR REPLACE FUNCTION sync_user_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('status', NEW.status)
                ELSE 
                    jsonb_set(
                        raw_user_meta_data,
                        '{status}',
                        to_jsonb(NEW.status)
                    )
            END
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for status sync
CREATE TRIGGER sync_user_status_trigger
    AFTER UPDATE OF status ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_status();

-- Update all existing users to approved status
UPDATE public.users 
SET status = 'approved' 
WHERE status != 'approved';

-- Sync all user statuses to auth.users
UPDATE auth.users u
SET raw_user_meta_data = 
    CASE 
        WHEN raw_user_meta_data IS NULL THEN 
            jsonb_build_object(
                'status', p.status,
                'role', p.role
            )
        ELSE 
            jsonb_set(
                jsonb_set(
                    raw_user_meta_data,
                    '{status}',
                    to_jsonb(p.status)
                ),
                '{role}',
                to_jsonb(p.role)
            )
    END
FROM public.users p
WHERE u.id = p.id;

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