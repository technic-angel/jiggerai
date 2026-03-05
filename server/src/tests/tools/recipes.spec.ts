/**
 * Tests for agents/tools/recipes.ts — recipe search, detail, library analysis tools.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  tool: vi.fn((config: any) => config),
}));

vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('../../db/schema.js', () => ({
  recipes: {
    id: 'id', name: 'name', category: 'category', baseSpirit: 'baseSpirit',
    ingredients: 'ingredients', difficulty: 'difficulty', glassType: 'glassType',
    imageEmoji: 'imageEmoji', instructions: 'instructions', abv: 'abv',
  },
  recipeSteps: { recipeId: 'recipeId', position: 'position', stepText: 'stepText', variantId: 'variantId' },
  recipeVariants: { baseRecipeId: 'baseRecipeId', variantLabel: 'variantLabel', variantNote: 'variantNote', ingredients: 'ingredients' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...a: any[]) => a),
  ilike: vi.fn((...a: any[]) => a),
  or: vi.fn((...a: any[]) => a),
  sql: vi.fn((...a: any[]) => a),
}));

import {
  searchRecipes,
  getRecipeDetails,
  getRecipesBySpirit,
  getLibraryOverview,
  analyzeLibraryGaps,
} from '../../agents/tools/recipes.js';
import { db } from '../../db/index.js';

function makeChain(data: any) {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    then: (resolve: any) => resolve(data),
  };
  return chain;
}

describe('recipe tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── searchRecipes ───────────────────────────────────────────────────────────
  describe('searchRecipes', () => {
    it('returns matching recipes', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, name: 'Mojito', category: 'Highball', baseSpirit: 'Rum', ingredients: ['Rum', 'Lime'], difficulty: 'Easy', glassType: 'Collins', imageEmoji: '🍹' },
      ]));

      const result = await searchRecipes.execute({ query: 'Mojito' });
      expect(result.recipes).toHaveLength(1);
      expect(result.message).toContain('1 recipe(s)');
    });

    it('returns empty message when no results', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));

      const result = await searchRecipes.execute({ query: 'NonExistent' });
      expect(result.recipes).toEqual([]);
      expect(result.message).toContain('No recipes found');
    });
  });

  // ── getRecipeDetails ──────────────────────────────────────────────────────
  describe('getRecipeDetails', () => {
    it('returns full recipe with steps and variants', async () => {
      (db.select as any)
        .mockReturnValueOnce(makeChain([{
          id: 1, name: 'Negroni', category: 'Stirred', baseSpirit: 'Gin',
          glassType: 'Rocks', difficulty: 'Easy', abv: '24%',
          ingredients: ['1 oz Gin', '1 oz Campari', '1 oz Sweet Vermouth'],
          instructions: 'Stir with ice.',
        }]))
        .mockReturnValueOnce(makeChain([
          { position: 1, stepText: 'Add ice to mixing glass' },
          { position: 2, stepText: 'Pour ingredients' },
        ]))
        .mockReturnValueOnce(makeChain([
          { variantLabel: 'Boulevardier', variantNote: 'Swap gin for bourbon', ingredients: ['bourbon', 'Campari', 'vermouth'] },
        ]));

      const result = await getRecipeDetails.execute({ recipeId: 1 });
      expect(result.name).toBe('Negroni');
      expect(result.instructions).toContain('1. Add ice');
      expect(result.variants).toHaveLength(1);
    });

    it('falls back to recipe instructions when no steps', async () => {
      (db.select as any)
        .mockReturnValueOnce(makeChain([{
          id: 2, name: 'Simple', category: 'Test', baseSpirit: 'Gin',
          glassType: 'Rocks', difficulty: 'Easy', abv: '10%',
          ingredients: ['Gin'], instructions: 'Just pour.',
        }]))
        .mockReturnValueOnce(makeChain([]))
        .mockReturnValueOnce(makeChain([]));

      const result = await getRecipeDetails.execute({ recipeId: 2 });
      expect(result.instructions).toBe('Just pour.');
      expect(result.variants).toBeUndefined();
    });

    it('returns error when recipe not found', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));

      const result = await getRecipeDetails.execute({ recipeId: 999 });
      expect(result.error).toContain('999');
    });
  });

  // ── getRecipesBySpirit ──────────────────────────────────────────────────────
  describe('getRecipesBySpirit', () => {
    it('returns recipes for a spirit', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, name: 'Daiquiri', category: 'Sour', ingredients: ['Rum'], difficulty: 'Easy', imageEmoji: '🍹' },
      ]));

      const result = await getRecipesBySpirit.execute({ spirit: 'rum' });
      expect(result.recipes).toHaveLength(1);
      expect(result.message).toContain('rum');
    });

    it('returns empty when no recipes found', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));

      const result = await getRecipesBySpirit.execute({ spirit: 'absinthe' });
      expect(result.recipes).toEqual([]);
      expect(result.message).toContain('No recipes found');
    });
  });

  // ── getLibraryOverview ──────────────────────────────────────────────────────
  describe('getLibraryOverview', () => {
    it('returns overview with spirit grouping', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, name: 'Negroni', category: 'Stirred', baseSpirit: 'Gin', difficulty: 'Easy', glassType: 'Rocks', ingredients: ['Gin'] },
        { id: 2, name: 'Daiquiri', category: 'Sour', baseSpirit: 'Rum', difficulty: 'Easy', glassType: 'Coupe', ingredients: ['Rum'] },
      ]));

      const result = await getLibraryOverview.execute({});
      expect(result.count).toBe(2);
      expect(result.recipes).toHaveLength(2);
      expect(result.summary).toContain('Gin');
      expect(result.summary).toContain('Rum');
    });

    it('returns empty library message', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));

      const result = await getLibraryOverview.execute({});
      expect(result.count).toBe(0);
      expect(result.message).toContain('empty');
    });

    it('groups recipes with null baseSpirit under Other', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, name: 'Mystery Drink', category: 'Other', baseSpirit: null, difficulty: null, glassType: null, ingredients: [] },
      ]));

      const result = await getLibraryOverview.execute({});
      expect(result.summary).toContain('Other');
    });
  });

  // ── analyzeLibraryGaps ──────────────────────────────────────────────────────
  describe('analyzeLibraryGaps', () => {
    it('reports missing essentials', async () => {
      const result = await analyzeLibraryGaps.execute({
        currentRecipes: [
          { name: 'Negroni', category: 'Stirred', baseSpirit: 'Gin', difficulty: 'Easy' },
        ],
      });

      expect(result.missingEssentials.length).toBeGreaterThan(0);
      expect(result.recommendation).toContain('missing');
    });

    it('reports all essentials covered', async () => {
      const essentials = [
        'Old Fashioned', 'Negroni', 'Margarita', 'Daiquiri', 'Manhattan',
        'Martini', 'Whiskey Sour', 'Mojito', 'Moscow Mule', 'Cosmopolitan',
        'Aperol Spritz', 'Paloma', 'Dark & Stormy', 'Espresso Martini',
        'Penicillin', 'Paper Plane', 'Last Word', 'Jungle Bird', 'French 75', 'Clover Club',
      ].map((name) => ({ name, category: 'Test', baseSpirit: 'Test', difficulty: 'Easy' }));

      const result = await analyzeLibraryGaps.execute({ currentRecipes: essentials });
      expect(result.missingEssentials).toHaveLength(0);
      expect(result.recommendation).toContain('basics covered');
    });

    it('detects under-represented spirits', async () => {
      const result = await analyzeLibraryGaps.execute({
        currentRecipes: [
          { name: 'Daiquiri', category: 'Sour', baseSpirit: 'Rum', difficulty: 'Easy' },
        ],
      });

      expect(result.underRepresentedSpirits).toContain('rum');
    });

    it('detects over-represented spirits', async () => {
      const recs = Array.from({ length: 6 }, (_, i) => ({
        name: `Gin Drink ${i}`, category: 'Test', baseSpirit: 'Gin', difficulty: 'Easy',
      }));

      const result = await analyzeLibraryGaps.execute({ currentRecipes: recs });
      expect(result.overRepresentedSpirits.some((s: string) => s.includes('gin'))).toBe(true);
    });

    it('handles recipes with null baseSpirit', async () => {
      const result = await analyzeLibraryGaps.execute({
        currentRecipes: [
          { name: 'Mystery', category: 'Other', baseSpirit: null, difficulty: null },
        ],
      });
      expect(result.totalInLibrary).toBe(1);
    });

    it('handles recipes with no category', async () => {
      const result = await analyzeLibraryGaps.execute({
        currentRecipes: [
          { name: 'Test', baseSpirit: 'Gin' },
        ],
      });
      expect(result.totalInLibrary).toBe(1);
    });
  });
});
