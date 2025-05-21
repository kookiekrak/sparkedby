-- Create new enum type with added value
CREATE TYPE template_type_new AS ENUM ('note', 'document', 'translated_note');

-- Add temporary column with the new type
ALTER TABLE template_library ADD COLUMN type_new template_type_new;
ALTER TABLE user_templates ADD COLUMN type_new template_type_new;

-- Copy data to new column, mapping existing values
UPDATE template_library SET type_new = type::text::template_type_new;
UPDATE user_templates SET type_new = type::text::template_type_new;

-- Drop old columns and rename new ones
ALTER TABLE template_library DROP COLUMN type;
ALTER TABLE template_library RENAME COLUMN type_new TO type;
ALTER TABLE user_templates DROP COLUMN type;
ALTER TABLE user_templates RENAME COLUMN type_new TO type;

-- Set the defaults and not null constraints
ALTER TABLE template_library ALTER COLUMN type SET DEFAULT 'note';
ALTER TABLE template_library ALTER COLUMN type SET NOT NULL;
ALTER TABLE user_templates ALTER COLUMN type SET NOT NULL;

-- Drop the old enum type
DROP TYPE template_type;

-- Rename the new enum type to the original name
ALTER TYPE template_type_new RENAME TO template_type;