-- 0008_add_equipment.sql
-- Add equipment (bar tools) array column to recipes table.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='equipment') THEN
    ALTER TABLE recipes ADD COLUMN equipment text[];
  END IF;
END$$;

COMMIT;
