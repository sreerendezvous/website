-- Create sample users who have applied to be creators
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    user3_id uuid;
BEGIN
    -- Create first user
    INSERT INTO public.users (
        email,
        full_name,
        role,
        status,
        verification_status,
        bio,
        profile_image,
        instagram,
        linkedin,
        other_social_links,
        interests,
        languages
    ) VALUES (
        'maya.patel@example.com',
        'Maya Patel',
        'user',
        'approved',
        'unverified',
        'Certified yoga instructor with expertise in mindfulness and meditation. Passionate about helping others find balance and inner peace.',
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
        'mindful_maya',
        'mayapatelyoga',
        '{"website": "https://mindfulwithmaya.com"}'::jsonb,
        ARRAY['Yoga', 'Meditation', 'Wellness'],
        ARRAY['English', 'Hindi']
    )
    RETURNING id INTO user1_id;

    -- Create second user
    INSERT INTO public.users (
        email,
        full_name,
        role,
        status,
        verification_status,
        bio,
        profile_image,
        instagram,
        linkedin,
        other_social_links,
        interests,
        languages
    ) VALUES (
        'james.chen@example.com',
        'James Chen',
        'user',
        'approved',
        'unverified',
        'Professional photographer specializing in street and cultural photography. Dedicated to teaching the art of visual storytelling.',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        'james.captures',
        'jameschenphotography',
        '{"website": "https://jameschenphotography.com"}'::jsonb,
        ARRAY['Photography', 'Street Art', 'Culture'],
        ARRAY['English', 'Mandarin']
    )
    RETURNING id INTO user2_id;

    -- Create third user
    INSERT INTO public.users (
        email,
        full_name,
        role,
        status,
        verification_status,
        bio,
        profile_image,
        instagram,
        linkedin,
        other_social_links,
        interests,
        languages
    ) VALUES (
        'sofia.martinez@example.com',
        'Sofia Martinez',
        'user',
        'approved',
        'unverified',
        'Culinary artist and chef with a focus on fusion cuisine. Love sharing the stories and techniques behind unique flavor combinations.',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        'chef_sofia',
        'sofiamartinezchef',
        '{"website": "https://sofiascuisine.com"}'::jsonb,
        ARRAY['Cooking', 'Food Photography', 'Wine'],
        ARRAY['English', 'Spanish']
    )
    RETURNING id INTO user3_id;

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