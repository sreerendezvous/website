/*
  # Add Languages and Social Links to Creator Profiles

  1. New Columns
    - languages (text array) - Languages spoken by the creator
    - specialties (text array) - Creator's areas of expertise
    - social_links (jsonb) - Social media and website links
    - cover_image (text) - URL of the creator's cover image
    - profile_image (text) - URL of the creator's profile image

  2. Changes
    - Add new columns to creator_profiles table
    - Add comments for better documentation
*/

-- Add new columns to creator_profiles if they don't exist
ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT ARRAY['English']::text[],
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cover_image text,
ADD COLUMN IF NOT EXISTS profile_image text;

-- Add comments to explain column usage
COMMENT ON COLUMN public.creator_profiles.languages IS 'Array of languages the creator speaks';
COMMENT ON COLUMN public.creator_profiles.specialties IS 'Array of creator''s areas of expertise';
COMMENT ON COLUMN public.creator_profiles.social_links IS 'JSON object containing social media links: { website?: string, instagram?: string, linkedin?: string }';
COMMENT ON COLUMN public.creator_profiles.cover_image IS 'URL of the creator''s cover image';
COMMENT ON COLUMN public.creator_profiles.profile_image IS 'URL of the creator''s profile image';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS creator_profiles_languages_idx ON public.creator_profiles USING gin(languages);
CREATE INDEX IF NOT EXISTS creator_profiles_specialties_idx ON public.creator_profiles USING gin(specialties);