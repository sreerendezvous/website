-- Drop existing policies to start fresh
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Create new policies without recursion
CREATE POLICY "Public read access"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Self insert access"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Self update access"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin full access"
ON public.users
FOR ALL
USING (is_admin(auth.uid()));

-- Update the user creation function to avoid recursion
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

-- Update the new user handler to use raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        status,
        verification_status,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        'pending',
        'unverified',
        now(),
        now()
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;