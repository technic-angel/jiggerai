-- Migration: Add recipe_steps and recipe_variants tables
-- These tables let the MixologistAgent cache structured instructions and
-- "upgrade path" variants so subsequent requests are served from Postgres
-- with zero AI calls.

-- -------------------------------------------------------------------
-- recipe_variants
-- One base recipe can have many upgrade variants (e.g. "Grand Marnier
-- Upgrade" for a standard Margarita).  Each variant stores its own
-- ingredient list, optional override instructions, and flavor profile
-- so the agent never has to regenerate them.
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_variants (
  id              SERIAL PRIMARY KEY,
  base_recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  variant_label   TEXT NOT NULL,
  variant_note    TEXT,
  ingredients     TEXT[] NOT NULL DEFAULT '{}',
  instructions    TEXT,
  image_url       TEXT,
  flavor_sweetness  NUMERIC(3,2),
  flavor_bitterness NUMERIC(3,2),
  flavor_sourness   NUMERIC(3,2),
  flavor_body       NUMERIC(3,2),
  flavor_embedding  vector(768),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_variants_base_recipe_id
  ON recipe_variants(base_recipe_id);

-- -------------------------------------------------------------------
-- recipe_steps
-- Ordered, step-by-step instructions for a recipe or one of its
-- variants.  variantId = NULL means the steps belong to the base
-- recipe; a non-null variantId means they override the base steps
-- for that variant.
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_steps (
  id               SERIAL PRIMARY KEY,
  recipe_id        INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  variant_id       INTEGER REFERENCES recipe_variants(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL DEFAULT 0,
  step_text        TEXT NOT NULL,
  duration_seconds INTEGER,
  tool_required    TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id
  ON recipe_steps(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_steps_variant_id
  ON recipe_steps(variant_id);

-- Composite index so fetching ordered steps for a recipe is fast
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_position
  ON recipe_steps(recipe_id, position);
