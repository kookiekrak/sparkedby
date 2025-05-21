-- Add unique constraint to transcripts table
ALTER TABLE transcripts ADD CONSTRAINT transcripts_visit_id_unique UNIQUE (visit_id); 