-- Create sample data
DO $$
DECLARE
    cultural_id uuid := 'd1427eb7-3e46-4b47-9071-11d8fe11c7e0';
    adventure_id uuid := 'd2a9e6a8-52d1-4d2b-a634-89e9c741693a';
    wellness_id uuid := 'd3f12c9b-7e5d-4f3a-b8d5-67a98b8c6d9e';
    sakura_id uuid;
    creator_profile_id uuid;
BEGIN
    -- Insert categories if they don't exist
    INSERT INTO public.categories (id, name, description, icon)
    VALUES
        (cultural_id, 'Cultural', 'Cultural experiences and traditions', 'Globe'),
        (adventure_id, 'Adventure', 'Outdoor and exciting experiences', 'Mountain'),
        (wellness_id, 'Wellness', 'Health and wellness activities', 'Heart')
    ON CONFLICT (id) DO NOTHING;

    -- Get existing user ID if it exists
    SELECT id INTO sakura_id FROM public.users WHERE email = 'sakura@example.com';

    -- If user doesn't exist, create them
    IF sakura_id IS NULL THEN
        sakura_id := gen_random_uuid();
        
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
        VALUES (
            sakura_id,
            'sakura@example.com',
            'Sakura Tanaka',
            'creator',
            'approved',
            'verified',
            'Tea ceremony master with 15 years of experience in traditional Japanese arts.',
            'https://images.unsplash.com/photo-1545048702-79362596cdc9'
        );

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
        VALUES (
            sakura_id,
            'Sakura''s Tea Ceremony',
            'approved',
            4.9,
            128,
            ARRAY['English', 'Japanese'],
            ARRAY['Tea Ceremony', 'Japanese Culture', 'Meditation']
        )
        RETURNING id INTO creator_profile_id;
    ELSE
        -- Get existing creator profile ID
        SELECT id INTO creator_profile_id 
        FROM public.creator_profiles 
        WHERE user_id = sakura_id;
    END IF;

    -- Create experience if it doesn't exist
    INSERT INTO public.experiences (
        creator_id,
        creator_profile_id,
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
        sakura_id,
        creator_profile_id,
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
    WHERE NOT EXISTS (
        SELECT 1 FROM public.experiences 
        WHERE creator_id = sakura_id 
        AND title = 'Traditional Tea Ceremony Experience'
    );

    -- Add media to the experience
    WITH exp AS (
        SELECT id FROM public.experiences 
        WHERE creator_id = sakura_id 
        AND title = 'Traditional Tea Ceremony Experience'
        LIMIT 1
    )
    INSERT INTO public.experience_media (
        experience_id,
        url,
        type,
        order_index
    )
    SELECT 
        exp.id,
        m.url,
        'image',
        m.idx
    FROM exp
    CROSS JOIN (VALUES
        ('https://images.unsplash.com/photo-1545048702-79362596cdc9', 0),
        ('https://images.unsplash.com/photo-1531983412531-1f49a365ffed', 1)
    ) AS m(url, idx)
    ON CONFLICT DO NOTHING;

END $$;