/*
  # Add role management and approval system

  1. New Tables
    - creator_profiles
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - business_name (text)
      - approval_status (text)
      - stripe_account_id (text)
      - rating (numeric)
      - reviews_count (integer)
      
    - creator_applications
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - status (text)
      - review_notes (text)
      - reviewed_by (uuid, foreign key)
      - submitted_at (timestamptz)
      - reviewed_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for different roles
*/

-- Creator profiles
CREATE TABLE public.creator_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    business_name text NOT NULL,
    approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    stripe_account_id text,
    rating numeric(3,2) DEFAULT 0,
    reviews_count integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved creator profiles"
    ON public.creator_profiles
    FOR SELECT
    USING (approval_status = 'approved');

CREATE POLICY "Creators can view own profile"
    ON public.creator_profiles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON public.creator_profiles
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Creator applications
CREATE TABLE public.creator_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    review_notes text,
    reviewed_by uuid REFERENCES public.users(id),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    UNIQUE(user_id, status)
);

ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

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
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Functions for role management
CREATE OR REPLACE FUNCTION approve_creator_application(application_id uuid, admin_id uuid)
RETURNS void AS $$
BEGIN
    -- Update application status
    UPDATE public.creator_applications
    SET status = 'approved',
        reviewed_by = admin_id,
        reviewed_at = now()
    WHERE id = application_id;

    -- Create creator profile
    INSERT INTO public.creator_profiles (user_id, business_name)
    SELECT user_id, 'Creator ' || user_id
    FROM public.creator_applications
    WHERE id = application_id;

    -- Update user role
    UPDATE public.users
    SET role = 'creator'
    WHERE id = (
        SELECT user_id 
        FROM public.creator_applications 
        WHERE id = application_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;