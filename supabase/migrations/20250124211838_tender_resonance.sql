/*
  # Initial Schema Setup

  1. Core Tables
    - users (basic user profiles)
    - experiences (marketplace listings)
    - bookings (simple booking records)

  2. Security
    - RLS enabled on all tables
    - Basic policies for data access
*/

-- Users table (profiles)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text NOT NULL,
  bio text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approved profiles"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Experiences table
CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  description text NOT NULL,
  price decimal NOT NULL CHECK (price >= 0),
  location text NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  max_participants integer NOT NULL CHECK (max_participants > 0),
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experiences"
  ON public.experiences
  FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage own experiences"
  ON public.experiences
  FOR ALL
  USING (creator_id = auth.uid());

-- Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  participant_count integer NOT NULL CHECK (participant_count > 0),
  total_amount decimal NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings"
  ON public.bookings
  FOR UPDATE
  USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();