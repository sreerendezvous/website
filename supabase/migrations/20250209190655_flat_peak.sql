-- Create sample data
DO $$
DECLARE
    cultural_id uuid := 'd1427eb7-3e46-4b47-9071-11d8fe11c7e0';
    wellness_id uuid := 'd3f12c9b-7e5d-4f3a-b8d5-67a98b8c6d9e';
    sakura_id uuid;
    creator_profile_id uuid;
BEGIN
    -- Get existing user and creator profile IDs
    SELECT u.id, cp.id INTO sakura_id, creator_profile_id
    FROM public.users u
    JOIN public.creator_profiles cp ON cp.user_id = u.id
    WHERE u.email = 'sakura@example.com';

    -- Only proceed if we found the user and creator profile
    IF sakura_id IS NOT NULL AND creator_profile_id IS NOT NULL THEN
        -- Delete any existing experiences for this creator
        DELETE FROM public.experiences WHERE creator_id = sakura_id;

        -- Create 5 different experiences
        WITH new_experiences AS (
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
            ) VALUES
            -- Zen Garden Design Workshop
            (
                sakura_id,
                creator_profile_id,
                'Zen Garden Design Workshop',
                'Learn the principles of Japanese garden design and create your own miniature Zen garden. This hands-on workshop covers traditional techniques, symbolism, and the philosophy behind Japanese gardens.',
                95,
                180,
                8,
                cultural_id,
                '{"name": "Zen Garden Studio", "address": "456 Peaceful Path", "city": "Kyoto", "country": "Japan"}'::jsonb,
                'approved',
                'instant',
                NULL
            ),
            -- Mindful Matcha Making
            (
                sakura_id,
                creator_profile_id,
                'Mindful Matcha Making',
                'Discover the art of preparing matcha green tea in this intimate workshop. Learn about matcha''s history, health benefits, and master the techniques for creating the perfect bowl of this energizing elixir.',
                65,
                120,
                6,
                wellness_id,
                '{"name": "Traditional Tea Room", "address": "789 Green Tea Lane", "city": "Kyoto", "country": "Japan"}'::jsonb,
                'approved',
                'instant',
                NULL
            ),
            -- Ikebana Flower Arrangement
            (
                sakura_id,
                creator_profile_id,
                'Ikebana Flower Arrangement',
                'Experience the meditative art of Ikebana, Japanese flower arrangement. Learn to create beautiful, minimalist compositions that embody the harmony between nature and human creativity.',
                85,
                150,
                10,
                cultural_id,
                '{"name": "Flower Studio", "address": "321 Blossom Way", "city": "Kyoto", "country": "Japan"}'::jsonb,
                'approved',
                'request',
                'Please let us know if you have any flower allergies.'
            ),
            -- Meditation & Tea Ceremony
            (
                sakura_id,
                creator_profile_id,
                'Meditation & Tea Ceremony',
                'Combine the peaceful practices of Zen meditation and traditional tea ceremony. This unique experience offers a deeper understanding of mindfulness through these complementary Japanese arts.',
                110,
                240,
                4,
                wellness_id,
                '{"name": "Zen Temple", "address": "159 Temple Road", "city": "Kyoto", "country": "Japan"}'::jsonb,
                'approved',
                'request',
                'Previous meditation experience recommended but not required.'
            ),
            -- Calligraphy Masterclass
            (
                sakura_id,
                creator_profile_id,
                'Calligraphy Masterclass',
                'Immerse yourself in the art of Japanese calligraphy (Shodo). Learn proper brush techniques, kanji characters, and create your own artistic pieces under expert guidance.',
                70,
                120,
                8,
                cultural_id,
                '{"name": "Calligraphy Center", "address": "753 Brush Stroke Street", "city": "Kyoto", "country": "Japan"}'::jsonb,
                'approved',
                'instant',
                NULL
            )
            RETURNING id, title
        )
        -- Add media for each experience
        INSERT INTO public.experience_media (experience_id, url, type, order_index)
        SELECT 
            e.id,
            m.url,
            'image',
            m.idx
        FROM new_experiences e
        CROSS JOIN LATERAL (
            VALUES 
                -- Zen Garden
                (CASE WHEN e.title = 'Zen Garden Design Workshop' 
                 THEN 'https://images.unsplash.com/photo-1464982326199-86f32f81b211' END, 0),
                (CASE WHEN e.title = 'Zen Garden Design Workshop'
                 THEN 'https://images.unsplash.com/photo-1534684686641-05569203ecca' END, 1),
                
                -- Matcha Making
                (CASE WHEN e.title = 'Mindful Matcha Making'
                 THEN 'https://images.unsplash.com/photo-1542326237-94b1c5a538d5' END, 0),
                (CASE WHEN e.title = 'Mindful Matcha Making'
                 THEN 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a' END, 1),
                
                -- Ikebana
                (CASE WHEN e.title = 'Ikebana Flower Arrangement'
                 THEN 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd' END, 0),
                (CASE WHEN e.title = 'Ikebana Flower Arrangement'
                 THEN 'https://images.unsplash.com/photo-1589123053646-4e8c49d46b35' END, 1),
                
                -- Meditation & Tea
                (CASE WHEN e.title = 'Meditation & Tea Ceremony'
                 THEN 'https://images.unsplash.com/photo-1545048702-79362596cdc9' END, 0),
                (CASE WHEN e.title = 'Meditation & Tea Ceremony'
                 THEN 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed' END, 1),
                
                -- Calligraphy
                (CASE WHEN e.title = 'Calligraphy Masterclass'
                 THEN 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f' END, 0),
                (CASE WHEN e.title = 'Calligraphy Masterclass'
                 THEN 'https://images.unsplash.com/photo-1583834722926-a91c0a7f7048' END, 1)
        ) AS m(url, idx)
        WHERE m.url IS NOT NULL;
    END IF;
END $$;