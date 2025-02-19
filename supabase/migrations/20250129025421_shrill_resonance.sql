-- Drop the dependent view first
DROP VIEW IF EXISTS public.experiences_with_categories;

-- Remove image_url constraint from experiences table
ALTER TABLE public.experiences
DROP COLUMN IF EXISTS image_url;

-- Ensure experience_media table exists with correct structure
CREATE TABLE IF NOT EXISTS public.experience_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    url text NOT NULL,
    type text NOT NULL DEFAULT 'image',
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on experience_media
ALTER TABLE public.experience_media ENABLE ROW LEVEL SECURITY;

-- Create policies for experience_media
CREATE POLICY "Anyone can view experience media"
    ON public.experience_media
    FOR SELECT
    USING (true);

CREATE POLICY "Creators can manage their experience media"
    ON public.experience_media
    FOR ALL
    USING (
        experience_id IN (
            SELECT id FROM public.experiences 
            WHERE creator_id = auth.uid()
        )
    );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS experience_media_experience_id_idx ON public.experience_media(experience_id);

-- Recreate the view without the image_url column
CREATE VIEW public.experiences_with_categories AS
SELECT 
    e.*,
    c.name as category_name,
    c.description as category_description,
    c.icon as category_icon
FROM public.experiences e
LEFT JOIN public.categories c ON e.category_id = c.id;