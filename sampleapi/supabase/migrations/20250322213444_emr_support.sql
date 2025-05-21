-- Create enum type for EMR types
CREATE TYPE emr_type AS ENUM ('mdland');

ALTER TABLE template_library ADD COLUMN emr_specific emr_type[] DEFAULT '{}';

