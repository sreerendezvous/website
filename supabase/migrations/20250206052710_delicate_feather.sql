-- Drop all existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access" ON public.users;
    DROP POLICY IF EXISTS "Self insert access" ON public.users;
    DROP POLICY IF EXISTS "Self update access" ON public.users;
    DROP POLICY IF EXISTS "Admin full access" ON public.users;
    DROP POLICY IF EXISTS "Users can view approved profiles" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies without recursion
CREATE POLICY "Allow public read access"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow self insert"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow self update"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin access"
ON public.users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Grant necessary permissions
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;

-- Create function to safely check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    );
$$;

-- Create function to safely get current user
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS public.users
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT * FROM public.users
    WHERE id = auth.uid();
$$;

-- Create function to safely update current user
CREATE OR REPLACE FUNCTION public.update_current_user(
    user_data jsonb
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.users;
BEGIN
    UPDATE public.users
    SET
        bio = COALESCE(user_data->>'bio', bio),
        instagram = COALESCE(user_data->>'instagram', instagram),
        linkedin = COALESCE(user_data->>'linkedin', linkedin),
        other_social_links = COALESCE(user_data->'other_social_links', other_social_links),
        interests = COALESCE((user_data->>'interests')::text[], interests),
        languages = COALESCE((user_data->>'languages')::text[], languages),
        updated_at = now()
    WHERE id = auth.uid()
    RETURNING * INTO result;

    RETURN result;
END;
$$;