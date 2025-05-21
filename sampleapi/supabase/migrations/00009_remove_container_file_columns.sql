-- Remove file_path and mime_type columns from containers table
ALTER TABLE containers DROP COLUMN file_path;
ALTER TABLE containers DROP COLUMN mime_type; 