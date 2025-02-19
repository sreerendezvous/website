/*
  # Seed Sample Data

  1. New Data
    - Sample categories with proper UUIDs
    - Sample experiences with media
    - Uses proper foreign key relationships

  2. Changes
    - Adds initial data for testing and development
    - Creates approved experiences
    - Includes media and location data

  3. Security
    - All data follows RLS policies
    - Uses proper foreign key relationships
*/

-- Insert sample categories if they don't exist
INSERT INTO public.categories (id, name, description, icon)
VALUES
  ('d1427eb7-3e46-4b47-9071-11d8fe11c7e0', 'Cultural', 'Cultural experiences and traditions', 'Globe'),
  ('d2a9e6a8-52d1-4d2b-a634-89e9c741693a', 'Adventure', 'Outdoor and exciting experiences', 'Mountain'),
  ('d3f12c9b-7e5d-4f3a-b8d5-67a98b8c6d9e', 'Wellness', 'Health and wellness activities', 'Heart')
ON CONFLICT (id) DO NOTHING;

-- Create sample experiences
DO $$
DECLARE
  user1_id uuid;
BEGIN
  -- Create first user and get their ID
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'sakura@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Sakura Tanaka", "role": "creator"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO user1_id;

  -- Insert sample experiences
  INSERT INTO public.experiences (
    id, creator_id, title, description, price, duration, max_participants,
    category_id, location, status, created_at, updated_at
  )
  VALUES
    (
      'e1b2a3d4-e5f6-4a3b-8c9d-0e1f2a3b4c5d',
      user1_id,
      'Traditional Tea Ceremony Experience',
      'Immerse yourself in the ancient art of Japanese tea ceremony. Learn about the history, philosophy, and precise movements that make this cultural practice so special.',
      75, 90, 6,
      'd1427eb7-3e46-4b47-9071-11d8fe11c7e0',
      '{"name": "Traditional Tea House", "address": "123 Zen Garden Way", "city": "Kyoto", "country": "Japan"}'::jsonb,
      'approved',
      now(), now()
    );

  -- Insert sample media
  INSERT INTO public.experience_media (experience_id, url, type, order_index)
  VALUES
    ('e1b2a3d4-e5f6-4a3b-8c9d-0e1f2a3b4c5d', 'https://images.unsplash.com/photo-1545048702-79362596cdc9', 'image', 0);

END $$;