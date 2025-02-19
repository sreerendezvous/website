-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view approved creator profiles" ON public.creator_profiles;
    DROP POLICY IF EXISTS "Anyone can view creator profiles" ON public.creator_profiles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Now we can safely drop the column
ALTER TABLE public.creator_profiles
DROP COLUMN IF EXISTS approval_status;

-- Update existing creator profiles to have proper metadata
UPDATE public.creator_profiles cp
SET
    business_name = COALESCE(
        cp.business_name,
        (SELECT full_name FROM public.users WHERE id = cp.user_id) || '''s Business'
    );

-- Create new simplified policy for creator profiles
CREATE POLICY "creator_profiles_read_policy"
ON public.creator_profiles
FOR SELECT
USING (true);

-- Update the update_user_role function to be simpler
CREATE OR REPLACE FUNCTION update_user_role(
    user_id_param uuid,
    new_role text,
    admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update user role
    UPDATE public.users
    SET 
        role = new_role,
        updated_at = now()
    WHERE id = user_id_param;

    -- If changing to creator role, create creator profile if it doesn't exist
    IF new_role = 'creator' THEN
        INSERT INTO public.creator_profiles (
            user_id,
            business_name,
            languages,
            created_at,
            updated_at
        )
        SELECT
            user_id_param,
            u.full_name || '''s Business',
            ARRAY['English'],
            now(),
            now()
        FROM public.users u
        WHERE u.id = user_id_param
        ON CONFLICT (user_id) 
        DO UPDATE SET
            updated_at = now();
    END IF;

    -- Log the action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_type,
        target_id,
        details
    ) VALUES (
        admin_id,
        'update_role',
        'user',
        user_id_param,
        jsonb_build_object(
            'new_role', new_role,
            'timestamp', now()
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text, uuid) TO authenticated;