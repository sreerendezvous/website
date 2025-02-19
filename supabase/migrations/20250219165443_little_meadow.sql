-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation without status references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create user profile with pending account_state
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        account_state,
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

-- Update any existing users to have proper account_state
UPDATE public.users
SET account_state = 'pending'
WHERE account_state IS NULL;