-- Add new values to the visit_state enum
ALTER TYPE visit_state ADD VALUE IF NOT EXISTS 'seen';
ALTER TYPE visit_state ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE visit_state ADD VALUE IF NOT EXISTS 'trash';
ALTER TYPE visit_state ADD VALUE IF NOT EXISTS 'deleted';
