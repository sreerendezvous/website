-- Drop creator applications table and related functions
DROP TABLE IF EXISTS public.creator_applications;
DROP FUNCTION IF EXISTS approve_creator_application(uuid, uuid);

-- Create user applications table
CREATE TABLE IF NOT EXISTS public.user_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    bio text,
    interests text[],
    languages text[],
    social_links jsonb,
    review_notes text,
    reviewed_by uuid REFERENCES public.users(id),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    UNIQUE(user_id, status)
);

-- Enable RLS
ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own applications"
    ON public.user_applications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can submit applications"
    ON public.user_applications
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM public.user_applications 
            WHERE user_id = auth.uid() AND status = 'pending'
        )
    );

CREATE POLICY "Admins can manage applications"
    ON public.user_applications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (raw_user_meta_data->>'role')::text = 'admin'
        )
    );

-- Create indexes
CREATE INDEX user_applications_user_id_idx ON public.user_applications(user_id);
CREATE INDEX user_applications_status_idx ON public.user_applications(status);

-- Update handle_new_user function to create application
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
        'user',
        'pending',
        'unverified',
        now(),
        now()
    );

    -- Create user application
    INSERT INTO public.user_applications (
        user_id,
        bio,
        interests,
        languages,
        social_links,
        submitted_at
    )
    VALUES (
        new.id,
        new.raw_user_meta_data->>'bio',
        ARRAY[]::text[],
        ARRAY['English']::text[],
        '{}'::jsonb,
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

-- Update approve_user function to handle applications
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

        -- Update application status
        UPDATE public.user_applications
        SET 
            status = 'approved',
            reviewed_by = admin_id_param,
            reviewed_at = now()
        WHERE user_id = user_id_param
        AND status = 'pending';

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
GRANT ALL ON public.user_applications TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user(uuid, uuid) TO authenticated;