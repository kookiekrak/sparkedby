-- Drop the existing index
DROP INDEX IF EXISTS idx_notes_non_template_unique;

-- Create new index including version_id
CREATE UNIQUE INDEX idx_notes_non_template_unique 
  ON notes (visit_id, type, version_id) 
  WHERE type != 'template';