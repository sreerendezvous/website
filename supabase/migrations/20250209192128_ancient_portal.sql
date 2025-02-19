/*
  # Add Sample Users Who Will Apply as Creators

  1. New Users
    - Creates 3 new users who will apply to be creators
    - Each user has unique background and expertise
  
  2. User Applications
    - Creates pending applications for review
*/

DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    user3_id uuid;
BEGIN
    -- Create first user
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
        'maya.patel@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Maya Patel", "role": "user"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO user1_id;

    -- Create second user
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
        'james.chen@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "James Chen", "role": "user"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO user2_id;

    -- Create third user
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
        'sofia.martinez@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Sofia Martinez", "role": "user"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO user3_id;

    -- Update user profiles with additional info
    UPDATE public.users
    SET
        bio = 'Certified yoga instructor with expertise in mindfulness and meditation. Passionate about helping others find balance and inner peace.',
        profile_image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
        instagram = 'mindful_maya',
        linkedin = 'mayapatelyoga',
        other_social_links = '{"website": "https://mindfulwithmaya.com"}'::jsonb,
        interests = ARRAY['Yoga', 'Meditation', 'Wellness'],
        languages = ARRAY['English', 'Hindi']
    WHERE id = user1_id;

    UPDATE public.users
    SET
        bio = 'Professional photographer specializing in street and cultural photography. Dedicated to teaching the art of visual storytelling.',
        profile_image = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        instagram = 'james.captures',
        linkedin = 'jameschenphotography',
        other_social_links = '{"website": "https://jameschenphotography.com"}'::jsonb,
        interests = ARRAY['Photography', 'Street Art', 'Culture'],
        languages = ARRAY['English', 'Mandarin']
    WHERE id = user2_id;

    UPDATE public.users
    SET
        bio = 'Culinary artist and chef with a focus on fusion cuisine. Love sharing the stories and techniques behind unique flavor combinations.',
        profile_image = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        instagram = 'chef_sofia',
        linkedin = 'sofiamartinezchef',
        other_social_links = '{"website": "https://sofiascuisine.com"}'::jsonb,
        interests = ARRAY['Cooking', 'Food Photography', 'Wine'],
        languages = ARRAY['English', 'Spanish']
    WHERE id = user3_id;

    -- Create creator applications
    INSERT INTO public.creator_applications (
        user_id,
        status,
        submitted_at
    ) VALUES
    (user1_id, 'pending', now()),
    (user2_id, 'pending', now()),
    (user3_id, 'pending', now());

END $$;