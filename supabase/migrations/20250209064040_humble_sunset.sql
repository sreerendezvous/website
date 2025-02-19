-- Create creator spotlights table
CREATE TABLE IF NOT EXISTS public.creator_spotlights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES public.users(id),
    title text NOT NULL,
    description text NOT NULL,
    media jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
    active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_spotlights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access for active spotlights"
    ON public.creator_spotlights
    FOR SELECT
    USING (active = true);

CREATE POLICY "Admins can manage spotlights"
    ON public.creator_spotlights
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX creator_spotlights_creator_id_idx ON public.creator_spotlights(creator_id);
CREATE INDEX creator_spotlights_active_idx ON public.creator_spotlights(active);
CREATE INDEX creator_spotlights_display_order_idx ON public.creator_spotlights(display_order);

-- Add function to update spotlight order
CREATE OR REPLACE FUNCTION update_spotlight_order(spotlight_id uuid, new_order integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update spotlight order';
    END IF;

    -- Update the order
    UPDATE public.creator_spotlights
    SET 
        display_order = new_order,
        updated_at = now()
    WHERE id = spotlight_id;
END;
$$;

-- Insert sample data
DO $$
DECLARE
    user_id uuid;
    media_array jsonb[];
BEGIN
    -- Get a user ID or use a default
    SELECT id INTO user_id FROM public.users WHERE email = 'sakura@example.com' LIMIT 1;
    
    -- If no user exists, skip the insert
    IF user_id IS NOT NULL THEN
        -- Create the media array
        media_array := ARRAY[
            '{"url": "https://images.unsplash.com/photo-1545048702-79362596cdc9", "type": "image", "order": 0}'::jsonb,
            '{"url": "https://images.unsplash.com/photo-1531983412531-1f49a365ffed", "type": "image", "order": 1}'::jsonb
        ];

        -- Insert the spotlight
        INSERT INTO public.creator_spotlights (
            creator_id,
            title,
            description,
            media,
            display_order
        ) VALUES (
            user_id,
            'Master Tea Ceremony Host',
            'Join Sakura for an authentic tea ceremony experience in her traditional tea house.',
            media_array,
            0
        );
    END IF;
END $$;