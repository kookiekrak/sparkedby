-- Create new enum type with additional value
CREATE TYPE note_type_new AS ENUM ('soap', 'template', 'ai_context');

-- Update existing notes to new type
ALTER TABLE notes
ALTER COLUMN type TYPE note_type_new 
USING type::text::note_type_new;

-- Drop old type
DROP TYPE note_type;

-- Rename new type to old name
ALTER TYPE note_type_new RENAME TO note_type;

-- Add user_facing column
ALTER TABLE notes
ADD COLUMN user_facing boolean NOT NULL DEFAULT true; 