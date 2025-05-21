ALTER TABLE notes
  ALTER COLUMN template_id
  SET DEFAULT '00000000-0000-0000-0000-000000000000';

ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_template_id_fkey;


  DROP INDEX IF EXISTS idx_notes_non_template_unique;
  DROP INDEX IF EXISTS idx_notes_template_unique;