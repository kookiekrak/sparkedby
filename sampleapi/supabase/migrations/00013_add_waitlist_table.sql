-- Create waitlist table for collecting early user interest
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Add comment to describe table purpose
COMMENT ON TABLE waitlist IS 'Stores email addresses of users interested in SparkedBy landing page generator';

-- Create index on email for faster lookups
CREATE INDEX waitlist_email_idx ON waitlist (email);

-- Add RLS (Row Level Security) policies
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all waitlist entries
CREATE POLICY "Allow authenticated users to view waitlist entries" 
ON waitlist FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert new waitlist entries
CREATE POLICY "Allow authenticated users to insert waitlist entries" 
ON waitlist FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow service role to manage all waitlist entries
CREATE POLICY "Allow service role full access to waitlist entries" 
ON waitlist
TO service_role
USING (true)
WITH CHECK (true);
