/*
  # Add core tables for experiences marketplace

  1. New Tables
    - categories
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - icon (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - experience_media
      - id (uuid, primary key)
      - experience_id (uuid, foreign key)
      - url (text)
      - type (text)
      - order_index (integer)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - reviews
      - id (uuid, primary key)
      - experience_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - rating (integer)
      - comment (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Add Relations
    - Add category_id to experiences table
    - Add RLS policies for all new tables

  3. Add Indexes
    - category_id on experiences
    - experience_id on experience_media
    - experience_id and user_id on reviews
*/

-- Categories table
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
    ON public.categories
    FOR SELECT
    USING (true);

-- Add category to experiences
ALTER TABLE public.experiences 
ADD COLUMN category_id uuid REFERENCES public.categories(id);

CREATE INDEX experiences_category_id_idx ON public.experiences(category_id);

-- Experience media table
CREATE TABLE public.experience_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    url text NOT NULL,
    type text NOT NULL DEFAULT 'image',
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.experience_media ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX experience_media_experience_id_idx ON public.experience_media(experience_id);

-- Reviews table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(experience_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
    ON public.reviews
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews for experiences they've booked"
    ON public.reviews
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        experience_id IN (
            SELECT experience_id FROM public.bookings 
            WHERE user_id = auth.uid() AND status = 'confirmed'
        )
    );

CREATE POLICY "Users can update their own reviews"
    ON public.reviews
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE INDEX reviews_experience_id_idx ON public.reviews(experience_id);
CREATE INDEX reviews_user_id_idx ON public.reviews(user_id);

-- Add computed columns for experience ratings
CREATE OR REPLACE FUNCTION get_experience_rating(experience_id uuid)
RETURNS numeric AS $$
    SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
    FROM public.reviews
    WHERE experience_id = $1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_experience_review_count(experience_id uuid)
RETURNS bigint AS $$
    SELECT COUNT(*)
    FROM public.reviews
    WHERE experience_id = $1;
$$ LANGUAGE SQL STABLE;