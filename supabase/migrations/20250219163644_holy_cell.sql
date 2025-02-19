-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_write_policy" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create maximally permissive policies
CREATE POLICY "users_read_policy"
ON public.users
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_write_policy"
ON public.users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Create simple function to approve user
CREATE OR REPLACE FUNCTION approve_user_simple(
    user_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET 
        account_state = 'approved',
        updated_at = now()
    WHERE id = user_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user_simple(uuid) TO authenticated;