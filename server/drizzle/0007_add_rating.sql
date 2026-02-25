-- Add user rating (1–5 stars, nullable) to inventory items and recipes
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS rating integer;
ALTER TABLE recipes    ADD COLUMN IF NOT EXISTS rating integer;
