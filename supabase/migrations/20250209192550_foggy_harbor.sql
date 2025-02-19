-- Create pending experiences for creators
DO $$
DECLARE
    cultural_id uuid := 'd1427eb7-3e46-4b47-9071-11d8fe11c7e0';
    wellness_id uuid := 'd3f12c9b-7e5d-4f3a-b8d5-67a98b8c6d9e';
    maya_id uuid;
    james_id uuid;
    sofia_id uuid;
BEGIN
    -- Get creator IDs
    SELECT id INTO maya_id FROM public.users WHERE email = 'maya.patel@example.com';
    SELECT id INTO james_id FROM public.users WHERE email = 'james.chen@example.com';
    SELECT id INTO sofia_id FROM public.users WHERE email = 'sofia.martinez@example.com';

    -- Create pending experiences for Maya
    WITH exp AS (
        INSERT INTO public.experiences (
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
        ) VALUES (
            maya_id,
            'Mindful Meditation Journey',
            'Join me for a transformative meditation experience that combines ancient wisdom with modern mindfulness practices. Perfect for both beginners and experienced practitioners.',
            45,
            90,
            8,
            wellness_id,
            '{"name": "Serenity Studio", "address": "123 Peace Lane", "city": "Mumbai", "country": "India"}'::jsonb,
            'pending',
            'instant',
            NULL
        ) RETURNING id
    )
    INSERT INTO public.experience_media (experience_id, url, type, order_index)
    SELECT 
        id,
        url,
        'image',
        idx
    FROM exp
    CROSS JOIN (VALUES
        ('https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7', 0),
        ('https://images.unsplash.com/photo-1545205597-3d9d02c29597', 1)
    ) AS m(url, idx);

    -- Create pending experiences for James
    WITH exp AS (
        INSERT INTO public.experiences (
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
        ) VALUES (
            james_id,
            'Urban Photography Adventure',
            'Explore the city through a photographer''s lens. Learn composition techniques, camera settings, and storytelling through visual imagery in this hands-on workshop.',
            75,
            180,
            6,
            cultural_id,
            '{"name": "City Center", "address": "456 Art Street", "city": "Hong Kong", "country": "China"}'::jsonb,
            'pending',
            'instant',
            NULL
        ) RETURNING id
    )
    INSERT INTO public.experience_media (experience_id, url, type, order_index)
    SELECT 
        id,
        url,
        'image',
        idx
    FROM exp
    CROSS JOIN (VALUES
        ('https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9', 0),
        ('https://images.unsplash.com/photo-1520974735549-8e4e0c47a174', 1)
    ) AS m(url, idx);

    -- Create pending experiences for Sofia
    WITH exp AS (
        INSERT INTO public.experiences (
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
        ) VALUES (
            sofia_id,
            'Fusion Cooking Masterclass',
            'Discover the art of combining Latin American and Asian flavors in this hands-on cooking workshop. Create unique dishes that tell a story of cultural fusion.',
            95,
            240,
            10,
            cultural_id,
            '{"name": "Culinary Studio", "address": "789 Flavor Avenue", "city": "Barcelona", "country": "Spain"}'::jsonb,
            'pending',
            'request',
            'Please note any dietary restrictions or allergies.'
        ) RETURNING id
    )
    INSERT INTO public.experience_media (experience_id, url, type, order_index)
    SELECT 
        id,
        url,
        'image',
        idx
    FROM exp
    CROSS JOIN (VALUES
        ('https://images.unsplash.com/photo-1556910103-1c02745aae4d', 0),
        ('https://images.unsplash.com/photo-1551218372-8a26d077b09f', 1)
    ) AS m(url, idx);
END $$;