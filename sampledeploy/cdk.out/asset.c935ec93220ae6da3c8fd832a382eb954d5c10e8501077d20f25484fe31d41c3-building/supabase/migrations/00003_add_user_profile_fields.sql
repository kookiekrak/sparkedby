-- Add new columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN title TEXT,
ADD COLUMN organization TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT; 