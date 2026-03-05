/**
 * Tests for agents/tools/cocktaildb.ts — TheCocktailDB API tools.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  tool: vi.fn((config: any) => config),
}));

import { lookupCocktailDB, findCocktailVariations, parseDrink } from '../../agents/tools/cocktaildb.js';

const executeLookup = lookupCocktailDB.execute as (args: { cocktailName: string }) => Promise<any>;
const executeVariations = findCocktailVariations.execute as (args: { cocktailName: string; baseSpirit?: string }) => Promise<any>;

describe('cocktaildb', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── parseDrink ──────────────────────────────────────────────────────────────
  describe('parseDrink', () => {
    it('parses a full drink with ingredients and measures', () => {
      const raw = {
        idDrink: '11007',
        strDrink: 'Margarita',
        strCategory: 'Ordinary Drink',
        strAlcoholic: 'Alcoholic',
        strGlass: 'Cocktail glass',
        strInstructions: 'Rub the rim...',
        strDrinkThumb: 'https://thumb.jpg',
        strIngredient1: 'Tequila',
        strMeasure1: '1 1/2 oz',
        strIngredient2: 'Triple sec',
        strMeasure2: '1/2 oz',
        strIngredient3: 'Lime juice',
        strMeasure3: '1 oz',
        strIngredient4: null,
      };

      const result = parseDrink(raw);
      expect(result.source).toBe('thecocktaildb');
      expect(result.id).toBe('11007');
      expect(result.name).toBe('Margarita');
      expect(result.ingredients).toEqual([
        '1 1/2 oz Tequila',
        '1/2 oz Triple sec',
        '1 oz Lime juice',
      ]);
      expect(result.glassType).toBe('Cocktail glass');
      expect(result.thumbnail).toBe('https://thumb.jpg');
    });

    it('handles missing measures', () => {
      const raw = {
        idDrink: '1',
        strDrink: 'Simple',
        strCategory: null,
        strAlcoholic: null,
        strGlass: null,
        strInstructions: null,
        strDrinkThumb: null,
        strIngredient1: 'Gin',
        strMeasure1: null,
        strIngredient2: 'Tonic',
        strMeasure2: '',
        strIngredient3: null,
      };

      const result = parseDrink(raw);
      expect(result.ingredients).toEqual(['Gin', 'Tonic']);
    });
  });

  // ── lookupCocktailDB ─────────────────────────────────────────────────────────
  describe('lookupCocktailDB', () => {
    it('returns found recipe on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          drinks: [
            {
              idDrink: '11007',
              strDrink: 'Margarita',
              strCategory: 'Sour',
              strAlcoholic: 'Alcoholic',
              strGlass: 'Coupe',
              strInstructions: 'Shake and strain.',
              strDrinkThumb: 'thumb.jpg',
              strIngredient1: 'Tequila',
              strMeasure1: '2 oz',
              strIngredient2: null,
            },
            {
              idDrink: '11008',
              strDrink: 'Frozen Margarita',
              strCategory: 'Sour',
              strAlcoholic: 'Alcoholic',
              strGlass: 'Margarita',
              strInstructions: 'Blend.',
              strDrinkThumb: 'thumb2.jpg',
              strIngredient1: 'Tequila',
              strMeasure1: '2 oz',
              strIngredient2: null,
            },
          ],
        }),
      } as any);

      const result = await executeLookup({ cocktailName: 'Margarita' });
      expect(result.found).toBe(true);
      expect(result.recipe.name).toBe('Margarita');
      expect(result.alternatives).toHaveLength(1);
    });

    it('returns found: false when drinks is null', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drinks: null }),
      } as any);

      const result = await executeLookup({ cocktailName: 'NotARealDrink' });
      expect(result.found).toBe(false);
    });

    it('returns found: false when drinks is empty', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drinks: [] }),
      } as any);

      const result = await executeLookup({ cocktailName: 'Empty' });
      expect(result.found).toBe(false);
    });

    it('returns found: false on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

      const result = await executeLookup({ cocktailName: 'Error' });
      expect(result.found).toBe(false);
      expect(result.message).toContain('500');
    });

    it('returns found: false on fetch error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network'));

      const result = await executeLookup({ cocktailName: 'Offline' });
      expect(result.found).toBe(false);
      expect(result.message).toContain('Network');
    });
  });

  // ── findCocktailVariations ──────────────────────────────────────────────────
  describe('findCocktailVariations', () => {
    it('returns variations from both spirit and name search', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            drinks: [
              { idDrink: '1', strDrink: 'Tommy\'s Margarita', strDrinkThumb: 't1.jpg' },
              { idDrink: '2', strDrink: 'Spicy Margarita', strDrinkThumb: 't2.jpg' },
              { idDrink: '3', strDrink: 'Margarita', strDrinkThumb: 't3.jpg' }, // exact match, should be excluded
            ],
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            drinks: [
              { idDrink: '3', strDrink: 'Margarita', strDrinkThumb: 't3.jpg' }, // exact match
              { idDrink: '4', strDrink: 'Frozen Margarita', strDrinkThumb: 't4.jpg' },
            ],
          }),
        } as any);

      const result = await executeVariations({ cocktailName: 'Margarita', baseSpirit: 'tequila' });
      expect(result.baseCocktail).toBe('Margarita');
      expect(result.dbVariations.length).toBeGreaterThan(0);
      // Should not include "Margarita" (the exact match)
      expect(result.dbVariations.every((v: any) => v.name !== 'Margarita')).toBe(true);
      expect(result.message).toContain('related cocktails');
    });

    it('handles no baseSpirit (only name search)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          drinks: [
            { idDrink: '5', strDrink: 'Variant A', strDrinkThumb: null },
          ],
        }),
      } as any);

      const result = await executeVariations({ cocktailName: 'TestCocktail' });
      expect(result.dbVariations).toHaveLength(1);
    });

    it('returns empty variations when no drinks found', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ drinks: null }),
      } as any);

      const result = await executeVariations({ cocktailName: 'Unknown', baseSpirit: 'gin' });
      expect(result.dbVariations).toHaveLength(0);
      expect(result.message).toContain('model knowledge');
    });

    it('handles fetch error gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Timeout'));

      const result = await executeVariations({ cocktailName: 'Fail', baseSpirit: 'vodka' });
      expect(result.dbVariations).toEqual([]);
      expect(result.message).toContain('Timeout');
    });

    it('deduplicates variations from both sources', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            drinks: [{ idDrink: '1', strDrink: 'Duplicate', strDrinkThumb: null }],
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            drinks: [{ idDrink: '1', strDrink: 'Duplicate', strDrinkThumb: null }],
          }),
        } as any);

      const result = await executeVariations({ cocktailName: 'Base', baseSpirit: 'rum' });
      expect(result.dbVariations).toHaveLength(1);
    });

    it('handles spirit search non-OK response but name search succeeds', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({ ok: false, status: 500 } as any) // spirit fails
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            drinks: [{ idDrink: '1', strDrink: 'VariantX', strDrinkThumb: null }],
          }),
        } as any);

      const result = await executeVariations({ cocktailName: 'TestBase', baseSpirit: 'gin' });
      expect(result.dbVariations).toHaveLength(1);
    });

    it('handles non-Error thrown value (no .message) in findCocktailVariations', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(42);
      const result = await executeVariations({ cocktailName: 'Fail', baseSpirit: 'gin' });
      expect(result.dbVariations).toEqual([]);
      expect(result.message).toContain('42');
    });
  });

  describe('lookupCocktailDB – non-Error thrown value', () => {
    it('handles non-Error thrown value (no .message)', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(42);
      const result = await executeLookup({ cocktailName: 'Fail' });
      expect(result.found).toBe(false);
      expect(result.message).toContain('42');
    });
  });
});
