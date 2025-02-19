-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_admin_policy" ON public.users;
    DROP POLICY IF EXISTS "users_read_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "users_write_policy" ON public.users;
    DROP POLICY IF EXISTS "admin_actions_policy" ON public.admin_actions;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

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

-- Create policy for admin_actions table
CREATE POLICY "admin_actions_policy"
ON public.admin_actions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT ALL ON public.admin_actions TO authenticated;

-- Create simplified RPC function for user approval
CREATE OR REPLACE FUNCTION approve_user_rpc(
    user_id_param uuid,
    admin_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update user status directly
    UPDATE public.users
    SET 
        status = 'approved',
        updated_at = now()
    WHERE id = user_id_param;

    -- Update auth.users metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('status', 'approved')
            ELSE 
                jsonb_set(
                    raw_user_meta_data,
                    '{status}',
                    '"approved"'
                )
        END
    WHERE id = user_id_param;

    -- Log the action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        admin_id_param,
        'approve',
        'user',
        user_id_param,
        jsonb_build_object(
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_user_rpc(uuid, uuid) TO authenticated;