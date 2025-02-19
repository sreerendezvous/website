-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation with proper approval flow
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_role text;
BEGIN
    -- Get role from metadata or use default
    default_role := COALESCE(
        new.raw_user_meta_data->>'role',
        'user'
    );

    -- Insert the user profile with pending status
    BEGIN
        -- Check if user already exists
        IF EXISTS (
            SELECT 1 FROM public.users WHERE id = new.id
        ) THEN
            RETURN new;
        END IF;

        -- Insert the user profile with pending status for ALL users
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
            default_role,
            'pending', -- Set all users to pending by default
            'unverified',
            now(),
            now()
        );

        -- If user is a creator, create creator profile
        IF default_role = 'creator' THEN
            INSERT INTO public.creator_profiles (
                user_id,
                business_name,
                approval_status,
                languages,
                created_at,
                updated_at
            ) VALUES (
                new.id,
                COALESCE(new.raw_user_meta_data->>'business_name', new.raw_user_meta_data->>'full_name'),
                'pending',
                ARRAY['English'],
                now(),
                now()
            )
            ON CONFLICT (user_id) DO NOTHING;
        END IF;

    EXCEPTION 
        WHEN unique_violation THEN
            RETURN new;
        WHEN OTHERS THEN
            RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
            RETURN new;
    END;

    RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users to pending if they haven't been approved yet
UPDATE public.users
SET status = 'pending'
WHERE status IS NULL OR status = 'approved'
AND NOT EXISTS (
    SELECT 1 FROM public.admin_actions
    WHERE target_type = 'user'
    AND target_id = users.id
    AND action_type = 'approve'
);