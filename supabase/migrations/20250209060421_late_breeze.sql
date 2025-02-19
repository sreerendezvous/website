-- Add booking type fields to experiences table
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'instant' CHECK (booking_type IN ('instant', 'request')),
ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS requirements_description text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS experiences_booking_type_idx ON public.experiences(booking_type);

-- Add booking requests table
CREATE TABLE IF NOT EXISTS public.booking_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid NOT NULL REFERENCES public.experiences(id),
    user_id uuid NOT NULL REFERENCES public.users(id),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message text,
    participant_count integer NOT NULL CHECK (participant_count > 0),
    total_amount decimal NOT NULL CHECK (total_amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on booking requests
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Add policies for booking requests
CREATE POLICY "Users can view own requests"
    ON public.booking_requests
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create requests"
    ON public.booking_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Creators can view requests for their experiences"
    ON public.booking_requests
    FOR SELECT
    USING (
        experience_id IN (
            SELECT id FROM public.experiences 
            WHERE creator_id = auth.uid()
        )
    );

CREATE POLICY "Creators can update request status"
    ON public.booking_requests
    FOR UPDATE
    USING (
        experience_id IN (
            SELECT id FROM public.experiences 
            WHERE creator_id = auth.uid()
        )
    );

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS booking_requests_experience_id_idx ON public.booking_requests(experience_id);
CREATE INDEX IF NOT EXISTS booking_requests_user_id_idx ON public.booking_requests(user_id);
CREATE INDEX IF NOT EXISTS booking_requests_status_idx ON public.booking_requests(status);