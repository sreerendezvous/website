-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user creation with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Check if user already exists to prevent duplicate inserts
    IF EXISTS (
        SELECT 1 FROM public.users WHERE id = new.id
    ) THEN
        RETURN new;
    END IF;

    -- Insert the user profile with proper error handling
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
            CASE 
                WHEN new.raw_user_meta_data->>'role' = 'creator' THEN 'pending'
                ELSE 'approved'
            END,
            'unverified',
            now(),
            now()
        );

        -- If user is a creator, create creator profile
        IF new.raw_user_meta_data->>'role' = 'creator' THEN
            INSERT INTO public.creator_profiles (
                user_id,
                business_name,
                approval_status,
                languages,
                created_at,
                updated_at
            ) VALUES (
                new.id,
                COALESCE(new.raw_user_meta_data->>'business_name', new.raw_user_meta_data->>'full_name'),
                'pending',
                ARRAY['English'],
                now(),
                now()
            )
            ON CONFLICT (user_id) DO NOTHING;
        END IF;

    EXCEPTION 
        WHEN unique_violation THEN
            -- If there's a duplicate key error, just return the trigger
            -- This prevents the error from bubbling up while still completing the auth signup
            RETURN new;
        WHEN OTHERS THEN
            -- Log other errors but don't fail the auth signup
            RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
            RETURN new;
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

-- Update RLS policies to ensure proper access control
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Self insert access" ON public.users;
DROP POLICY IF EXISTS "Self update access" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;

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
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);