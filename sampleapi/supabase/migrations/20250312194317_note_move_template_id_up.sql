-- Drop existing unique constraint first, then index
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_visit_id_type_unique;

-- Add new columns
ALTER TABLE notes 
  ADD COLUMN template_id UUID REFERENCES template_library(id),
  ADD COLUMN version_id SERIAL;

-- Move template_id from metadata to new column
UPDATE notes 
SET template_id = (metadata->>'template_id')::uuid 
WHERE type = 'template' 
  AND metadata->>'template_id' IS NOT NULL;

-- Remove template_id from metadata
UPDATE notes 
SET metadata = metadata - 'template_id'
WHERE type = 'template' 
  AND metadata->>'template_id' IS NOT NULL;

-- Add new unique constraints using partial indexes
CREATE UNIQUE INDEX idx_notes_template_unique 
  ON notes (visit_id, type, template_id, version_id) 
  WHERE type = 'template';

CREATE UNIQUE INDEX idx_notes_non_template_unique 
  ON notes (visit_id, type) 
  WHERE type != 'template';
