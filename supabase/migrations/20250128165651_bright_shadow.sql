/*
  # Admin User and Policy Setup

  1. Changes
    - Set admin role for specified user
    - Add admin-specific RLS policies
    - Add admin capabilities function

  2. Security
    - Enable RLS for admin actions
    - Add policies for admin access
*/

-- Set admin role for specified user
UPDATE public.users
SET role = 'admin'
WHERE email = 'sree@letsrendezvous.co';

-- Add function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin-specific policies (with safety checks)
DO $$ 
BEGIN
    -- Users table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Admins can view all users'
    ) THEN
        CREATE POLICY "Admins can view all users"
            ON public.users
            FOR SELECT
            TO authenticated
            USING (is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Admins can update user roles'
    ) THEN
        CREATE POLICY "Admins can update user roles"
            ON public.users
            FOR UPDATE
            TO authenticated
            USING (is_admin());
    END IF;

    -- Creator applications policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'creator_applications' AND policyname = 'Admins can manage creator applications'
    ) THEN
        CREATE POLICY "Admins can manage creator applications"
            ON public.creator_applications
            FOR ALL
            TO authenticated
            USING (is_admin());
    END IF;

    -- Creator verifications policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'creator_verifications' AND policyname = 'Admins can manage verifications'
    ) THEN
        CREATE POLICY "Admins can manage verifications"
            ON public.creator_verifications
            FOR ALL
            TO authenticated
            USING (is_admin());
    END IF;
END $$;