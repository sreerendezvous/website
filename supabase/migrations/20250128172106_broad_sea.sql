-- Add status column to experiences table if it doesn't exist
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS experiences_status_idx ON public.experiences(status);

-- Update RLS policies for experiences table
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved experiences"
  ON public.experiences
  FOR SELECT
  USING (status = 'approved' OR creator_id = auth.uid());

CREATE POLICY "Admins can view all experiences"
  ON public.experiences
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update experience status"
  ON public.experiences
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ));