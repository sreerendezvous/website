/*
  # Add creator features and admin functionality

  1. New Tables
    - creator_verifications
      - For identity and background verification
    - creator_specialties
      - Track creator expertise areas
    - admin_actions
      - Audit log for admin actions
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Creator verifications
CREATE TABLE public.creator_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES public.creator_profiles(id),
    type text NOT NULL CHECK (type IN ('identity', 'background', 'professional')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by uuid REFERENCES public.users(id),
    verification_data jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own verifications"
    ON public.creator_verifications
    FOR SELECT
    USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage verifications"
    ON public.creator_verifications
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Creator specialties
CREATE TABLE public.creator_specialties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES public.creator_profiles(id),
    category_id uuid NOT NULL REFERENCES public.categories(id),
    years_experience integer NOT NULL DEFAULT 0,
    certifications jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(creator_id, category_id)
);

ALTER TABLE public.creator_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creator specialties"
    ON public.creator_specialties
    FOR SELECT
    USING (true);

CREATE POLICY "Creators can manage own specialties"
    ON public.creator_specialties
    FOR ALL
    USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));

-- Admin actions log
CREATE TABLE public.admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES public.users(id),
    action_type text NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view action logs"
    ON public.admin_actions
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create action logs"
    ON public.admin_actions
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Functions for admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    admin_id uuid,
    action_type text,
    target_type text,
    target_id uuid,
    details jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    action_id uuid;
BEGIN
    INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, details)
    VALUES (admin_id, action_type, target_type, target_id, details)
    RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;