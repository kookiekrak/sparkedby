-- Drop columns from ai_cache
ALTER TABLE ai_cache
DROP COLUMN last_used_at,
DROP COLUMN use_count,
DROP COLUMN metadata;

-- Add use_context column
ALTER TABLE ai_cache
ADD COLUMN use_context text; 