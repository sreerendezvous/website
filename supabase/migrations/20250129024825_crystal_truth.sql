-- Add new columns to experiences table
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS requirements text[],
ADD COLUMN IF NOT EXISTS included_items text[],
ADD COLUMN IF NOT EXISTS not_included_items text[],
ADD COLUMN IF NOT EXISTS cancellation_policy text CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict')),
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS accessibility_options jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS location jsonb DEFAULT jsonb_build_object(
    'name', 'Location name',
    'address', 'Address',
    'city', 'City',
    'country', 'Country'
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS experiences_cancellation_policy_idx ON public.experiences(cancellation_policy);
CREATE INDEX IF NOT EXISTS experiences_languages_idx ON public.experiences USING gin(languages);

-- Add comment to explain accessibility_options structure
COMMENT ON COLUMN public.experiences.accessibility_options IS 'JSON object containing accessibility features: { wheelchairAccessible: boolean, mobilityAccess: boolean, hearingAccess: boolean, visualAccess: boolean }';

-- Add comment to explain location structure
COMMENT ON COLUMN public.experiences.location IS 'JSON object containing location details: { name: string, address: string, city: string, country: string, coordinates?: { latitude: number, longitude: number } }';

-- Update existing rows with default values
UPDATE public.experiences
SET 
    short_description = CASE 
        WHEN short_description IS NULL THEN substring(description from 1 for 200)
        ELSE short_description
    END,
    requirements = CASE 
        WHEN requirements IS NULL THEN ARRAY[]::text[]
        ELSE requirements
    END,
    included_items = CASE 
        WHEN included_items IS NULL THEN ARRAY[]::text[]
        ELSE included_items
    END,
    not_included_items = CASE 
        WHEN not_included_items IS NULL THEN ARRAY[]::text[]
        ELSE not_included_items
    END,
    cancellation_policy = CASE 
        WHEN cancellation_policy IS NULL THEN 'flexible'
        ELSE cancellation_policy
    END,
    languages = CASE 
        WHEN languages IS NULL THEN ARRAY['English']::text[]
        ELSE languages
    END
WHERE id IS NOT NULL;