-- 0005_add_image_and_favorites.sql
-- Add image_url columns to inventory and recipes, and ensure user_favorites exists.

BEGIN;

-- Add image_url to inventory if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='image_url') THEN
    ALTER TABLE inventory ADD COLUMN image_url text;
  END IF;
END$$;

-- Add image_url to recipes if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='image_url') THEN
    ALTER TABLE recipes ADD COLUMN image_url text;
  END IF;
END$$;

-- Create user_favorites table if it does not exist (safe no-op)
CREATE TABLE IF NOT EXISTS user_favorites (
  id serial PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id integer NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamp without time zone DEFAULT now() NOT NULL
);

COMMIT;
