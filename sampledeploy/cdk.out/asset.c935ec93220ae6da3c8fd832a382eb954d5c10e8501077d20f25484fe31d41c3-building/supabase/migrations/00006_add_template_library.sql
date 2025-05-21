-- Create enum for template types
CREATE TYPE template_type AS ENUM ('soap', 'assessment', 'plan', 'custom');

-- Create the template_library table
CREATE TABLE template_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    sample_output TEXT,
    type template_type NOT NULL,
    specialty TEXT,
    tags TEXT[], -- Array of tags
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    editable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX template_library_owner_id_idx ON template_library(owner_id);
CREATE INDEX template_library_type_idx ON template_library(type);
CREATE INDEX template_library_specialty_idx ON template_library(specialty);
CREATE INDEX template_library_tags_idx ON template_library USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE template_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- View policy: Users can view their own templates and non-editable templates
CREATE POLICY "Users can view their own and shared templates"
    ON template_library
    FOR SELECT
    USING (
        owner_id = auth.uid() OR 
        (editable = false)
    );

-- Insert policy: Users can create new templates
CREATE POLICY "Users can create templates"
    ON template_library
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Update policy: Users can only update their own templates that are editable
CREATE POLICY "Users can update their own editable templates"
    ON template_library
    FOR UPDATE
    USING (owner_id = auth.uid() AND editable = true)
    WITH CHECK (owner_id = auth.uid() AND editable = true);

-- Delete policy: Users can only delete their own templates that are editable
CREATE POLICY "Users can delete their own editable templates"
    ON template_library
    FOR DELETE
    USING (owner_id = auth.uid() AND editable = true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_template_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_template_library_updated_at
    BEFORE UPDATE ON template_library
    FOR EACH ROW
    EXECUTE FUNCTION update_template_library_updated_at(); 