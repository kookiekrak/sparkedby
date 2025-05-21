-- Create visit state enum
CREATE TYPE visit_state AS ENUM ('new', 'recording', 'paused', 'processing', 'ready');

-- Add state column to visits table
ALTER TABLE visits ADD COLUMN state visit_state NOT NULL DEFAULT 'new';

-- Create index on state column
CREATE INDEX idx_visits_state ON visits(state); 