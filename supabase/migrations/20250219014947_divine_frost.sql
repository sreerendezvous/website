-- Drop existing trigger first, then functions
DO $$ 
BEGIN
    -- Drop trigger first
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Then drop functions
    DROP FUNCTION IF EXISTS public.approve_user_rpc(uuid, uuid);
    DROP FUNCTION IF EXISTS public.handle_new_user();
END $$;

-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_write_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "admin_actions_policy" ON public.admin_actions;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;

-- Create new handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create user profile with approved status by default
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
        'user',
        'approved', -- Auto-approve all users
        'unverified',
        now(),
        now()
    );

    RETURN new;
EXCEPTION 
    WHEN unique_violation THEN
        RETURN new;
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
DO $$ 
BEGIN
    CREATE POLICY "users_read_access"
    ON public.users
    FOR SELECT
    TO public
    USING (true);

    CREATE POLICY "users_write_access"
    ON public.users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "admin_actions_access"
    ON public.admin_actions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT ALL ON public.admin_actions TO authenticated;

-- Update existing users to approved status
UPDATE public.users SET status = 'approved' WHERE status = 'pending';