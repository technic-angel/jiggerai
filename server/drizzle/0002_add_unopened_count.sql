-- 0002_add_unopened_count.sql
-- Add unopened_count to inventory so users can track full unused bottles

BEGIN;

ALTER TABLE IF EXISTS inventory
  ADD COLUMN IF NOT EXISTS unopened_count integer NOT NULL DEFAULT 0;

-- Ensure unopened_count has sensible bounds via a CHECK constraint (0-99)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'inventory_unopened_count_check'
  ) THEN
    ALTER TABLE inventory
      ADD CONSTRAINT inventory_unopened_count_check CHECK (unopened_count >= 0 AND unopened_count <= 99);
  END IF;
END$$;

COMMIT;
