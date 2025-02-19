/*
  # Add sample data with video content

  1. Categories
    - Cultural, Adventure, Wellness categories
  2. Sample Experience
    - Traditional Tea Ceremony with multiple media items including video
  3. Media
    - Multiple images and a video for immersive experience preview
*/

-- Insert sample categories if they don't exist
INSERT INTO public.categories (id, name, description, icon)
VALUES
  ('d1427eb7-3e46-4b47-9071-11d8fe11c7e0', 'Cultural', 'Cultural experiences and traditions', 'Globe'),
  ('d2a9e6a8-52d1-4d2b-a634-89e9c741693a', 'Adventure', 'Outdoor and exciting experiences', 'Mountain'),
  ('d3f12c9b-7e5d-4f3a-b8d5-67a98b8c6d9e', 'Wellness', 'Health and wellness activities', 'Heart')
ON CONFLICT (id) DO NOTHING;

-- Create sample experience with media
DO $$
DECLARE
  user1_id uuid;
  exp_id uuid := 'e1b2a3d4-e5f6-4a3b-8c9d-0e1f2a3b4c5d';
BEGIN
  -- Get existing user ID or use a default
  SELECT id INTO user1_id FROM public.users WHERE email = 'sakura@example.com' LIMIT 1;
  
  -- If no user exists, use a default ID
  IF user1_id IS NULL THEN
    user1_id := 'e5f6a3d4-b2c1-4a3b-8c9d-0e1f2a3b4c5d';
  END IF;

  -- Insert or update the experience
  INSERT INTO public.experiences (
    id,
    creator_id,
    title,
    description,
    price,
    duration,
    max_participants,
    category_id,
    location,
    status,
    created_at,
    updated_at
  )
  VALUES (
    exp_id,
    user1_id,
    'Traditional Tea Ceremony Experience',
    'Immerse yourself in the ancient art of Japanese tea ceremony. Learn about the history, philosophy, and precise movements that make this cultural practice so special. Watch our introduction video to get a glimpse of the experience.',
    75,
    90,
    6,
    'd1427eb7-3e46-4b47-9071-11d8fe11c7e0',
    '{"name": "Traditional Tea House", "address": "123 Zen Garden Way", "city": "Kyoto", "country": "Japan"}'::jsonb,
    'approved',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = now();

  -- Delete existing media for this experience
  DELETE FROM public.experience_media WHERE experience_id = exp_id;

  -- Insert multiple media items including video
  INSERT INTO public.experience_media (experience_id, url, type, order_index)
  VALUES
    (exp_id, 'https://images.unsplash.com/photo-1545048702-79362596cdc9', 'image', 0),
    (exp_id, 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed', 'image', 1),
    (exp_id, 'https://player.vimeo.com/external/394678700.sd.mp4?s=1016a11b668f451999e5b3474c30d530c1670fd4&profile_id=165&oauth2_token_id=57447761', 'video', 2),
    (exp_id, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3', 'image', 3);

END $$;