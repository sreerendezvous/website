/*
  # Fix Creator Experiences Relationship

  1. Changes
    - Add creator_profile_id column to experiences table
    - Add foreign key constraint to link experiences to creator profiles
    - Update existing experiences to link to creator profiles
    - Add indexes for better query performance

  2. Security
    - Enable RLS on affected tables
    - Update policies to reflect new relationship
*/

-- Add creator_profile_id to experiences table
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS creator_profile_id uuid REFERENCES public.creator_profiles(id);

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS experiences_creator_profile_id_idx ON public.experiences(creator_profile_id);

-- Update existing experiences to link to creator profiles
UPDATE public.experiences e
SET creator_profile_id = cp.id
FROM public.creator_profiles cp
WHERE e.creator_id = cp.user_id;

-- Add function to ensure creator_profile_id is set correctly
CREATE OR REPLACE FUNCTION ensure_creator_profile_id()
RETURNS trigger AS $$
BEGIN
    -- Get the creator profile ID for the creator
    SELECT id INTO NEW.creator_profile_id
    FROM public.creator_profiles
    WHERE user_id = NEW.creator_id;

    IF NEW.creator_profile_id IS NULL THEN
        RAISE EXCEPTION 'No creator profile found for user %', NEW.creator_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically set creator_profile_id
CREATE TRIGGER set_creator_profile_id
    BEFORE INSERT OR UPDATE ON public.experiences
    FOR EACH ROW
    EXECUTE FUNCTION ensure_creator_profile_id();

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view approved experiences" ON public.experiences;
CREATE POLICY "Anyone can view approved experiences"
    ON public.experiences
    FOR SELECT
    USING (
        status = 'approved' OR 
        creator_id = auth.uid() OR
        creator_profile_id IN (
            SELECT id FROM public.creator_profiles 
            WHERE user_id = auth.uid()
        )
    );