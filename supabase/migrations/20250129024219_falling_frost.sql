-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Storage policies
    DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
    DROP POLICY IF EXISTS "Creators can delete own media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can upload media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can update media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can delete media" ON storage.objects;

    -- Experience policies
    DROP POLICY IF EXISTS "Anyone can view approved experiences" ON public.experiences;
    DROP POLICY IF EXISTS "Creators can manage own experiences" ON public.experiences;
    DROP POLICY IF EXISTS "Admins can view all experiences" ON public.experiences;
    DROP POLICY IF EXISTS "Anyone can create experiences" ON public.experiences;
    DROP POLICY IF EXISTS "Anyone can view experiences" ON public.experiences;
    DROP POLICY IF EXISTS "Creators can update own experiences" ON public.experiences;
    DROP POLICY IF EXISTS "Creators can delete own experiences" ON public.experiences;

    -- Experience media policies
    DROP POLICY IF EXISTS "Anyone can view experience media" ON public.experience_media;
    DROP POLICY IF EXISTS "Creators can manage their experience media" ON public.experience_media;
    DROP POLICY IF EXISTS "Anyone can create experience media" ON public.experience_media;
    DROP POLICY IF EXISTS "Anyone can view experience media" ON public.experience_media;
    DROP POLICY IF EXISTS "Creators can update own experience media" ON public.experience_media;
    DROP POLICY IF EXISTS "Creators can delete own experience media" ON public.experience_media;
END $$;

-- Create new storage policies
CREATE POLICY "Media upload policy"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Media view policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Media update policy"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'media');

CREATE POLICY "Media delete policy"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'media');

-- Fix experience policies
ALTER TABLE public.experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experience creation policy"
ON public.experiences
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Experience view policy"
ON public.experiences
FOR SELECT
TO public
USING (true);

CREATE POLICY "Experience update policy"
ON public.experiences
FOR UPDATE
USING (creator_id = auth.uid());

CREATE POLICY "Experience delete policy"
ON public.experiences
FOR DELETE
USING (creator_id = auth.uid());

-- Fix experience media policies
ALTER TABLE public.experience_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experience media creation policy"
ON public.experience_media
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Experience media view policy"
ON public.experience_media
FOR SELECT
TO public
USING (true);

CREATE POLICY "Experience media update policy"
ON public.experience_media
FOR UPDATE
USING (
    experience_id IN (
        SELECT id FROM public.experiences 
        WHERE creator_id = auth.uid()
    )
);

CREATE POLICY "Experience media delete policy"
ON public.experience_media
FOR DELETE
USING (
    experience_id IN (
        SELECT id FROM public.experiences 
        WHERE creator_id = auth.uid()
    )
);