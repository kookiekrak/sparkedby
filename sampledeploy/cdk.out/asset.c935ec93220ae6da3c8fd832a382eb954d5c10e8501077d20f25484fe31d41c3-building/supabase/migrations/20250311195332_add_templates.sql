-- Drop existing policies from template_library
DROP POLICY IF EXISTS "Users can view their own and shared templates" ON template_library;
DROP POLICY IF EXISTS "Users can create templates" ON template_library;
DROP POLICY IF EXISTS "Users can update their own editable templates" ON template_library;
DROP POLICY IF EXISTS "Users can delete their own editable templates" ON template_library;

-- Drop editable column and add version_id and published columns to template_library
ALTER TABLE template_library 
  DROP COLUMN IF EXISTS editable,
  ADD COLUMN version_id int DEFAULT 1,
  ADD COLUMN published BOOLEAN DEFAULT false;

-- Add policy for public access to templates without owner or published templates
CREATE POLICY "Public can view templates without owner or published templates"
  ON template_library
  FOR SELECT
  USING (owner_id IS NULL OR (owner_id IS NOT NULL AND published = true));

-- Create index on version_id
CREATE INDEX idx_template_library_version_id ON template_library(version_id);

-- Create user_templates table
CREATE TABLE user_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  sample_output TEXT,
  type template_type NOT NULL,
  specialty TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_id SERIAL NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create indexes
CREATE INDEX idx_user_templates_user_id ON user_templates(user_id);
CREATE INDEX idx_user_templates_version_id ON user_templates(version_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to user_templates
CREATE TRIGGER update_user_templates_updated_at
    BEFORE UPDATE ON user_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Add RLS policies for user_templates
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates"
  ON user_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON user_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON user_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON user_templates
  FOR DELETE
  USING (auth.uid() = user_id);
