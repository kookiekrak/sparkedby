-- Create new note type enum
CREATE TYPE note_type_new AS ENUM ('soap', 'template');

-- Convert existing type column to text temporarily
ALTER TABLE notes ALTER COLUMN type TYPE TEXT;

-- Add temporary column with the new type
ALTER TABLE notes ADD COLUMN type_new note_type_new;

-- Update the temporary column with the new values
UPDATE notes SET type_new = 'soap' WHERE type IN ('summary', 'assessment', 'plan');
UPDATE notes SET type_new = 'template' WHERE type = 'custom';

-- Drop the old column and rename the new one
ALTER TABLE notes DROP COLUMN type;
ALTER TABLE notes RENAME COLUMN type_new TO type;

-- Set not null constraint
ALTER TABLE notes ALTER COLUMN type SET NOT NULL;

-- Drop the old enum type
DROP TYPE note_type;

-- Rename the new enum type to the original name
ALTER TYPE note_type_new RENAME TO note_type; 