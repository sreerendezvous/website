-- Add status column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing users to approved status
UPDATE public.users
SET status = 'approved'
WHERE status = 'pending';

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);