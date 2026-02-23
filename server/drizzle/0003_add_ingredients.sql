-- 0003_add_ingredients.sql
-- Create ingredients table and recipe_ingredients join table, and link inventory

BEGIN;

-- Ingredients table: canonical list of any ingredient (spirit, mixer, garnish)
CREATE TABLE IF NOT EXISTS ingredients (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  type text NOT NULL,
  unit text,
  default_volume_ml numeric(8,2),
  perishable boolean DEFAULT false,
  category text,
  flavor_embedding vector(768),
  created_at timestamp with time zone DEFAULT now()
);

-- Recipe ingredients join table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id serial PRIMARY KEY,
  recipe_id integer NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id integer NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  amount_text text,
  amount_ml numeric(8,2),
  position integer DEFAULT 0
);

-- Link inventory rows to ingredients (nullable for gradual migration)
ALTER TABLE IF EXISTS inventory
  ADD COLUMN IF NOT EXISTS ingredient_id integer REFERENCES ingredients(id) ON DELETE SET NULL;

COMMIT;
