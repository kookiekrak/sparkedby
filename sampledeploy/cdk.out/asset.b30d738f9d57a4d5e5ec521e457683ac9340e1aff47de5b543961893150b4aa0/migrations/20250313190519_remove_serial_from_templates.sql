-- Remove SERIAL constraint by changing to integer
-- First drop the default value (which is the sequence)
ALTER TABLE notes 
ALTER COLUMN version_id DROP DEFAULT;

-- Drop the sequence
DROP SEQUENCE IF EXISTS notes_version_id_seq;

-- Change the column type to integer while keeping NOT NULL constraint and add default 1
ALTER TABLE notes
ALTER COLUMN version_id TYPE integer,
ALTER COLUMN version_id SET DEFAULT 1;

-- Remove SERIAL constraint by changing to integer
-- First drop the default value (which is the sequence)
ALTER TABLE user_templates 
ALTER COLUMN version_id DROP DEFAULT;

-- Drop the sequence
DROP SEQUENCE IF EXISTS user_templates_version_id_seq;

-- Change the column type to integer while keeping NOT NULL constraint
ALTER TABLE user_templates
ALTER COLUMN version_id TYPE integer,
ALTER COLUMN version_id SET DEFAULT 1;

-- Add NOT NULL constraint to template_library version_id
ALTER TABLE template_library
ALTER COLUMN version_id SET NOT NULL;
