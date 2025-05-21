-- Add notePreferences and memory columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN user_flags JSONB DEFAULT '{}'::jsonb,
ADD COLUMN note_preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN memory JSONB DEFAULT '{
  "replacements": [],
  "snippets": []
}'::jsonb;
