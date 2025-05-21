-- Add name column to visits table
ALTER TABLE visits ADD COLUMN name text;

-- Update the visits table RLS policies
CREATE POLICY "Users can update visit name"
ON public.visits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 