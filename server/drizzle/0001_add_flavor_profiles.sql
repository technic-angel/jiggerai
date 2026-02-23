-- 0001_add_flavor_profiles.sql
-- Add numeric flavor profile columns and flavor embedding vectors
-- Reserved for future agent-driven taste/profile features

BEGIN;

-- Inventory: add optional flavor attributes and embedding
ALTER TABLE IF EXISTS inventory
  ADD COLUMN IF NOT EXISTS flavor_sweetness numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_bitterness numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_sourness numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_body numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_embedding vector(768);

-- Recipes: add optional flavor attributes and embedding
ALTER TABLE IF EXISTS recipes
  ADD COLUMN IF NOT EXISTS flavor_sweetness numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_bitterness numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_sourness numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_body numeric(3,2),
  ADD COLUMN IF NOT EXISTS flavor_embedding vector(768);

-- Create an HNSW index for recipe flavor embeddings (if pgvector is available)
-- This index improves nearest-neighbor searches on recipe flavor vectors.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgvector') THEN
    BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS recipe_flavor_embedding_hnsw ON recipes USING hnsw (flavor_embedding vector_cosine_ops)';
    EXCEPTION WHEN others THEN
      -- If the database does not support HNSW or vector ops, skip index creation
      RAISE NOTICE 'Skipping HNSW index creation for recipe_flavor_embedding: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pgvector extension not installed; flavor embedding index skipped.';
  END IF;
END$$;

COMMIT;
