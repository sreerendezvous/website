-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view approved profiles" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own social links" ON public.users;
    DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new policies with proper permissions
CREATE POLICY "Anyone can view users"
    ON public.users
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
    ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to safely create user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_data jsonb
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user public.users;
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        status,
        verification_status,
        bio,
        instagram,
        linkedin,
        other_social_links,
        interests,
        languages,
        created_at,
        updated_at
    )
    VALUES (
        auth.uid(),
        user_data->>'email',
        user_data->>'full_name',
        COALESCE(user_data->>'role', 'user'),
        COALESCE(user_data->>'status', 'pending'),
        COALESCE(user_data->>'verification_status', 'unverified'),
        user_data->>'bio',
        user_data->>'instagram',
        user_data->>'linkedin',
        COALESCE(user_data->'other_social_links', '{}'::jsonb),
        COALESCE((user_data->>'interests')::text[], ARRAY[]::text[]),
        COALESCE((user_data->>'languages')::text[], ARRAY['English']::text[]),
        now(),
        now()
    )
    RETURNING * INTO new_user;

    RETURN new_user;
END;
$$;

-- Update the handle_new_user function to use the secure create_user_profile function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    PERFORM public.create_user_profile(
        jsonb_build_object(
            'email', new.email,
            'full_name', COALESCE(new.raw_user_meta_data->>'full_name', new.email),
            'role', COALESCE(new.raw_user_meta_data->>'role', 'user')
        )
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;