-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access their own visits" ON public.visits;

-- Enable RLS on all tables (visits already enabled)
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Visits policies
CREATE POLICY "Users can view their own visits"
ON public.visits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits"
ON public.visits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits"
ON public.visits FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visits"
ON public.visits FOR DELETE
USING (auth.uid() = user_id);

-- Transcripts policies (linked to visits)
CREATE POLICY "Users can view transcripts of their own visits"
ON public.transcripts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = transcripts.visit_id
    AND visits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert transcripts for their own visits"
ON public.transcripts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_id
    AND visits.user_id = auth.uid()
  )
);

-- Containers policies (linked to visits)
CREATE POLICY "Users can view containers of their own visits"
ON public.containers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = containers.visit_id
    AND visits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert containers for their own visits"
ON public.containers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_id
    AND visits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update containers of their own visits"
ON public.containers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = containers.visit_id
    AND visits.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_id
    AND visits.user_id = auth.uid()
  )
);

-- Notes policies (linked to visits)
CREATE POLICY "Users can view notes of their own visits"
ON public.notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = notes.visit_id
    AND visits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert notes for their own visits"
ON public.notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_id
    AND visits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update notes of their own visits"
ON public.notes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = notes.visit_id
    AND visits.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = visit_id
    AND visits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete notes of their own visits"
ON public.notes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = notes.visit_id
    AND visits.user_id = auth.uid()
  )
);
