
-- Create custom types
CREATE TYPE container_state AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE note_type AS ENUM ('summary', 'assessment', 'plan', 'custom');

-- Create visits table (with user_id, without client_id)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT visits_ended_after_started CHECK (ended_at IS NULL OR ended_at > started_at)
);

-- Create transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    full_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create containers table (replaces transcriptions)
CREATE TABLE containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    chunk_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    transcript_fragment TEXT,
    state container_state NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT containers_chunk_id_visit_unique UNIQUE (visit_id, chunk_id)
);

-- Create notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    type note_type NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create AI cache table
CREATE TABLE ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_hash TEXT NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    use_count INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT ai_cache_input_hash_unique UNIQUE (input_hash)
);

-- Create indexes
CREATE INDEX idx_visits_started_at ON visits(started_at);
CREATE INDEX idx_transcripts_visit_id ON transcripts(visit_id);
CREATE INDEX idx_containers_visit_id ON containers(visit_id);
CREATE INDEX idx_containers_state ON containers(state);
CREATE INDEX idx_containers_chunk_id ON containers(chunk_id);
CREATE INDEX idx_notes_visit_id ON notes(visit_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_ai_cache_input_hash ON ai_cache(input_hash);
CREATE INDEX idx_ai_cache_last_used ON ai_cache(last_used_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_containers_updated_at
    BEFORE UPDATE ON containers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update ai_cache last_used and use_count
CREATE OR REPLACE FUNCTION update_ai_cache_usage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    NEW.use_count = OLD.use_count + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_cache_usage
    BEFORE UPDATE ON ai_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_cache_usage();

-- Create RLS policy for visits
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own visits"
ON public.visits
FOR ALL
USING (auth.uid() = user_id); 