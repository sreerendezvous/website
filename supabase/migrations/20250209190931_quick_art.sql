-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS set_creator_profile_id ON public.experiences;
DROP FUNCTION IF EXISTS ensure_creator_profile_id();

-- Create a more permissive function for creator profile handling
CREATE OR REPLACE FUNCTION ensure_creator_profile_id()
RETURNS trigger AS $$
DECLARE
    profile_id uuid;
BEGIN
    -- Get the creator profile ID for the creator
    SELECT id INTO profile_id
    FROM public.creator_profiles
    WHERE user_id = NEW.creator_id;

    -- If no profile exists, create one
    IF profile_id IS NULL THEN
        INSERT INTO public.creator_profiles (
            user_id,
            business_name,
            approval_status,
            languages,
            created_at,
            updated_at
        )
        VALUES (
            NEW.creator_id,
            (SELECT full_name FROM public.users WHERE id = NEW.creator_id),
            'approved',
            ARRAY['English'],
            now(),
            now()
        )
        RETURNING id INTO profile_id;
    END IF;

    NEW.creator_profile_id = profile_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER set_creator_profile_id
    BEFORE INSERT OR UPDATE ON public.experiences
    FOR EACH ROW
    EXECUTE FUNCTION ensure_creator_profile_id();

-- Update existing experiences with creator profile IDs
UPDATE public.experiences e
SET creator_profile_id = cp.id
FROM public.creator_profiles cp
WHERE e.creator_id = cp.user_id
AND e.creator_profile_id IS NULL;

-- Ensure all experiences have proper status
UPDATE public.experiences
SET status = 'approved'
WHERE status IS NULL;

-- Ensure all experiences have proper booking type
UPDATE public.experiences
SET booking_type = 'instant'
WHERE booking_type IS NULL;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS experiences_creator_id_idx ON public.experiences(creator_id);
CREATE INDEX IF NOT EXISTS experiences_status_idx ON public.experiences(status);
CREATE INDEX IF NOT EXISTS experiences_booking_type_idx ON public.experiences(booking_type);

-- Update RLS policies to be more permissive
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view approved experiences" ON public.experiences;
    DROP POLICY IF EXISTS "Experience creation policy" ON public.experiences;
    DROP POLICY IF EXISTS "Experience view policy" ON public.experiences;
    DROP POLICY IF EXISTS "Experience update policy" ON public.experiences;
    DROP POLICY IF EXISTS "Experience delete policy" ON public.experiences;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create simplified policies
CREATE POLICY "Anyone can view experiences"
    ON public.experiences
    FOR SELECT
    USING (true);

CREATE POLICY "Creators can manage own experiences"
    ON public.experiences
    FOR ALL
    USING (creator_id = auth.uid());

CREATE POLICY "Admins can manage all experiences"
    ON public.experiences
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );