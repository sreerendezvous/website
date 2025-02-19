-- Add categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create unique index for name if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON public.categories(name);

-- Enable RLS on categories
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

-- Allow public read access to categories
CREATE POLICY "Anyone can view categories"
    ON public.categories
    FOR SELECT
    USING (true);

-- Add initial categories if they don't exist
INSERT INTO public.categories (name, description, icon)
SELECT 'cultural', 'Cultural experiences and traditions', 'Globe'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'cultural');

INSERT INTO public.categories (name, description, icon)
SELECT 'wellness', 'Health and wellness activities', 'Heart'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'wellness');

INSERT INTO public.categories (name, description, icon)
SELECT 'thought-leadership', 'Professional development and learning', 'Brain'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'thought-leadership');

INSERT INTO public.categories (name, description, icon)
SELECT 'entertainment', 'Fun and engaging activities', 'Music'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'entertainment');

INSERT INTO public.categories (name, description, icon)
SELECT 'adventure', 'Outdoor and exciting experiences', 'Mountain'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'adventure');

-- Add category_id to experiences if it doesn't exist
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS experiences_category_id_idx ON public.experiences(category_id);

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.experiences_with_categories;

-- Add view for easier category access
CREATE VIEW public.experiences_with_categories AS
SELECT 
    e.*,
    c.name as category_name,
    c.description as category_description,
    c.icon as category_icon
FROM public.experiences e
LEFT JOIN public.categories c ON e.category_id = c.id;