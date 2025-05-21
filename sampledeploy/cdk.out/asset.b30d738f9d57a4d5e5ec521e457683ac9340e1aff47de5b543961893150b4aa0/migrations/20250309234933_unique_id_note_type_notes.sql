-- Add unique constraint to notes table for visit_id and type
ALTER TABLE notes ADD CONSTRAINT notes_visit_id_type_unique UNIQUE (visit_id, type);