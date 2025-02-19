-- Create creator applications table with proper foreign key
CREATE TABLE IF NOT EXISTS public.creator_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    business_name text,
    bio text,
    specialties text[],
    experience text,
    certifications jsonb,
    social_links jsonb,
    review_notes text,
    reviewed_by uuid REFERENCES public.users(id),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    UNIQUE(user_id, status)
);

-- Enable RLS
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own applications"
    ON public.creator_applications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can submit applications"
    ON public.creator_applications
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM public.creator_applications 
            WHERE user_id = auth.uid() AND status = 'pending'
        )
    );

CREATE POLICY "Admins can manage applications"
    ON public.creator_applications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (raw_user_meta_data->>'role')::text = 'admin'
        )
    );

-- Create indexes
CREATE INDEX creator_applications_user_id_idx ON public.creator_applications(user_id);
CREATE INDEX creator_applications_status_idx ON public.creator_applications(status);

-- Update approve_creator_application function
CREATE OR REPLACE FUNCTION approve_creator_application(
    application_id uuid,
    admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id_var uuid;
    creator_profile_id uuid;
BEGIN
    -- Verify admin status
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = admin_id
        AND (raw_user_meta_data->>'role')::text = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve applications';
    END IF;

    -- Get user_id from application
    SELECT user_id INTO user_id_var
    FROM public.creator_applications
    WHERE id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Start transaction
    BEGIN
        -- Update application status
        UPDATE public.creator_applications
        SET 
            status = 'approved',
            reviewed_by = admin_id,
            reviewed_at = now()
        WHERE id = application_id;

        -- Create or update creator profile
        INSERT INTO public.creator_profiles (
            user_id,
            business_name,
            approval_status,
            languages,
            specialties,
            created_at,
            updated_at
        )
        SELECT
            user_id_var,
            COALESCE(ca.business_name, u.full_name || '''s Business'),
            'approved',
            ARRAY['English'],
            ca.specialties,
            now(),
            now()
        FROM public.creator_applications ca
        JOIN public.users u ON u.id = ca.user_id
        WHERE ca.id = application_id
        ON CONFLICT (user_id) 
        DO UPDATE SET
            business_name = EXCLUDED.business_name,
            approval_status = 'approved',
            specialties = EXCLUDED.specialties,
            updated_at = now()
        RETURNING id INTO creator_profile_id;

        -- Update user role
        UPDATE public.users
        SET 
            role = 'creator',
            updated_at = now()
        WHERE id = user_id_var;

        -- Log the action
        INSERT INTO public.admin_actions (
            admin_id,
            action_type,
            target_type,
            target_id,
            details
        ) VALUES (
            admin_id,
            'approve',
            'creator',
            user_id_var,
            jsonb_build_object(
                'application_id', application_id,
                'creator_profile_id', creator_profile_id,
                'timestamp', now()
            )
        );
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Failed to approve creator: %', SQLERRM;
    END;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.creator_applications TO authenticated;
GRANT EXECUTE ON FUNCTION approve_creator_application(uuid, uuid) TO authenticated;