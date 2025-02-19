-- Create sample data
DO $$
DECLARE
    cultural_id uuid := 'd1427eb7-3e46-4b47-9071-11d8fe11c7e0';
    adventure_id uuid := 'd2a9e6a8-52d1-4d2b-a634-89e9c741693a';
    wellness_id uuid := 'd3f12c9b-7e5d-4f3a-b8d5-67a98b8c6d9e';
BEGIN
    -- Insert categories if they don't exist
    INSERT INTO public.categories (id, name, description, icon)
    VALUES
        (cultural_id, 'Cultural', 'Cultural experiences and traditions', 'Globe'),
        (adventure_id, 'Adventure', 'Outdoor and exciting experiences', 'Mountain'),
        (wellness_id, 'Wellness', 'Health and wellness activities', 'Heart')
    ON CONFLICT (id) DO NOTHING;

    -- Create sample users and experiences
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
    )
    SELECT
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'demo.sakura@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'full_name', 'Sakura Tanaka',
            'role', 'creator'
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'demo.sakura@example.com'
    );

    -- Create user profile
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        status,
        verification_status,
        bio,
        profile_image
    )
    SELECT
        id,
        email,
        raw_user_meta_data->>'full_name',
        'creator',
        'approved',
        'verified',
        'Tea ceremony master with 15 years of experience in traditional Japanese arts.',
        'https://images.unsplash.com/photo-1545048702-79362596cdc9'
    FROM auth.users
    WHERE email = 'demo.sakura@example.com'
    ON CONFLICT (id) DO NOTHING;

    -- Create creator profile
    INSERT INTO public.creator_profiles (
        user_id,
        business_name,
        approval_status,
        rating,
        reviews_count,
        languages,
        specialties
    )
    SELECT
        id,
        'Sakura''s Tea Ceremony',
        'approved',
        4.9,
        128,
        ARRAY['English', 'Japanese'],
        ARRAY['Tea Ceremony', 'Japanese Culture', 'Meditation']
    FROM public.users
    WHERE email = 'demo.sakura@example.com'
    ON CONFLICT (user_id) DO NOTHING;

    -- Create experience
    WITH user_data AS (
        SELECT id FROM public.users WHERE email = 'demo.sakura@example.com'
    )
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
        booking_type,
        requirements_description
    )
    SELECT
        gen_random_uuid(),
        id,
        'Traditional Tea Ceremony Experience',
        'Immerse yourself in the ancient art of Japanese tea ceremony. Learn about the history, philosophy, and precise movements that make this cultural practice so special.',
        75,
        90,
        6,
        cultural_id,
        '{"name": "Traditional Tea House", "address": "123 Zen Garden Way", "city": "Kyoto", "country": "Japan"}'::jsonb,
        'approved',
        'request',
        'Please note any dietary restrictions or mobility limitations.'
    FROM user_data
    WHERE EXISTS (SELECT 1 FROM user_data);

    -- Add experience media
    WITH exp_data AS (
        SELECT e.id as experience_id
        FROM public.experiences e
        JOIN public.users u ON e.creator_id = u.id
        WHERE u.email = 'demo.sakura@example.com'
        AND e.title = 'Traditional Tea Ceremony Experience'
    )
    INSERT INTO public.experience_media (
        experience_id,
        url,
        type,
        order_index
    )
    SELECT
        experience_id,
        url,
        'image',
        idx
    FROM exp_data,
    (VALUES
        ('https://images.unsplash.com/photo-1545048702-79362596cdc9', 0),
        ('https://images.unsplash.com/photo-1531983412531-1f49a365ffed', 1)
    ) AS media(url, idx)
    ON CONFLICT DO NOTHING;

END $$;