-- Create new enum types
CREATE TYPE template_type_new AS ENUM ('note', 'document');
CREATE TYPE note_type_new AS ENUM ('soap', 'template');

-- Add temporary columns with the new types
ALTER TABLE template_library ADD COLUMN type_new template_type_new;
ALTER TABLE notes ADD COLUMN type_new note_type_new;

-- Update the temporary columns with the new values
UPDATE template_library SET type_new = 'note' WHERE type IN ('soap', 'assessment', 'plan', 'custom');
UPDATE notes SET type_new = 'soap' WHERE type IN ('summary', 'assessment', 'plan');
UPDATE notes SET type_new = 'template' WHERE type = 'custom';

-- Drop the old columns and rename the new ones
ALTER TABLE template_library DROP COLUMN type;
ALTER TABLE template_library RENAME COLUMN type_new TO type;
ALTER TABLE notes DROP COLUMN type;
ALTER TABLE notes RENAME COLUMN type_new TO type;

-- Set the defaults and not null constraints
ALTER TABLE template_library ALTER COLUMN type SET DEFAULT 'note';
ALTER TABLE template_library ALTER COLUMN type SET NOT NULL;
ALTER TABLE notes ALTER COLUMN type SET NOT NULL;

-- Drop the old enum types
DROP TYPE template_type;
DROP TYPE note_type;

-- Rename the new enum types to the original names
ALTER TYPE template_type_new RENAME TO template_type;
ALTER TYPE note_type_new RENAME TO note_type;

-- Make owner_id nullable and update foreign key constraint
ALTER TABLE template_library ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE template_library DROP CONSTRAINT template_library_owner_id_fkey;
ALTER TABLE template_library ADD CONSTRAINT template_library_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL; 