-- 0004_enable_pg_trgm_and_index.sql
-- Enable pg_trgm extension and add trigram index on ingredients.name for fuzzy search

BEGIN;

-- Create extension if available
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pg_trgm not available: %', SQLERRM;
    END;
  END IF;
END$$;

-- Create trigram index for ingredients.name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS ingredients_name_trgm_idx ON ingredients USING gin (name gin_trgm_ops)';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create trigram index: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_trgm not installed; skipping trigram index creation.';
  END IF;
END$$;

COMMIT;
