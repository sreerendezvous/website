-- Drop existing trigger first, then functions
DO $$ 
BEGIN
    -- Drop trigger first
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Then drop functions
    DROP FUNCTION IF EXISTS public.approve_user_rpc(uuid, uuid);
    DROP FUNCTION IF EXISTS public.handle_new_user();
END $$;

-- Add status check constraint if it doesn't exist
DO $$
BEGIN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'active'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create new function to handle user creation without approval requirement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert the user profile without requiring approval
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
        'pending', -- Start as pending
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

-- Create function to handle feature access approval
CREATE OR REPLACE FUNCTION public.approve_user_features(
    user_id_param uuid,
    admin_id_param uuid
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
        WHERE id = admin_id_param
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve features';
    END IF;

    -- Update user status
    UPDATE public.users
    SET 
        status = 'approved',
        updated_at = now()
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
        'approve_features',
        'user',
        user_id_param,
        jsonb_build_object(
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.approve_user_features(uuid, uuid) TO authenticated;

-- Add RLS policies for feature access
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "feature_access_policy" ON public.experiences;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "feature_access_policy"
ON public.experiences
FOR SELECT
USING (
    status = 'approved' OR -- Always show approved experiences
    creator_id = auth.uid() OR -- Creators can see their own
    EXISTS ( -- Admins can see all
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Update admin user
DO $$
DECLARE
    admin_email text := 'sree@letsrendezvous.co';
    admin_id uuid;
BEGIN
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