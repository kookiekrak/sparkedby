-- Add unique constraint for notes table to support upsert operation in containerText.ts
-- This fixes the error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

ALTER TABLE notes ADD CONSTRAINT notes_visit_id_type_template_id_version_id_key 
UNIQUE (visit_id, type, template_id, version_id);
