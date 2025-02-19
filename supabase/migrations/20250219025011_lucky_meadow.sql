-- Drop existing status check constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_status_check;

-- Add new status check constraint with correct values
ALTER TABLE public.users
ADD CONSTRAINT users_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update any invalid status values to 'pending'
UPDATE public.users
SET status = 'pending'
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create user profile with pending status
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
        'pending', -- Start as pending
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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure admin user has correct status
UPDATE public.users
SET status = 'approved'
WHERE email = 'sree@letsrendezvous.co';