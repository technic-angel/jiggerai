-- Migration: Add rich fields to recipes and isFavorite to inventory
-- These columns let the frontend display recipe detail cards (spirit, ABV,
-- glass type, difficulty, emoji icon) and per-bottle favorite flags without
-- additional API round-trips.

-- ── recipes ────────────────────────────────────────────────────────────────
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS base_spirit  TEXT,
  ADD COLUMN IF NOT EXISTS abv          TEXT,
  ADD COLUMN IF NOT EXISTS glass_type   TEXT,
  ADD COLUMN IF NOT EXISTS difficulty   TEXT,
  ADD COLUMN IF NOT EXISTS image_emoji  TEXT;

-- ── inventory ──────────────────────────────────────────────────────────────
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS is_favorite INTEGER NOT NULL DEFAULT 0;
