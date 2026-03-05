/**
 * Tests for agents/tools/library.ts — proposeAddToLibrary, addCocktailToLibrary,
 * and helper functions (fetchYouTubeUrl, fetchCocktailImage, inferEquipment).
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('ai', () => ({
  tool: vi.fn((config: any) => config),
}));

vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('../../db/schema.js', () => ({
  recipes: { id: 'id', name: 'name' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...a: any[]) => a),
}));

import {
  proposeAddToLibrary,
  addCocktailToLibrary,
  fetchYouTubeUrl,
  fetchCocktailImage,
  inferEquipment,
} from '../../agents/tools/library.js';
import { db } from '../../db/index.js';

function makeChain(data: any) {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    values: vi.fn(() => chain),
    returning: vi.fn(() => chain),
    then: (resolve: any) => resolve(data),
  };
  return chain;
}

describe('library tools', () => {
  const origKey = process.env.YOUTUBE_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    process.env.YOUTUBE_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (origKey !== undefined) process.env.YOUTUBE_API_KEY = origKey;
    else delete process.env.YOUTUBE_API_KEY;
  });

  // ── inferEquipment ──────────────────────────────────────────────────────────
  describe('inferEquipment', () => {
    it('detects shaker from instructions', () => {
      const eq = inferEquipment('Shake vigorously with ice', ['2 oz Gin']);
      expect(eq.some((e) => e.includes('Cocktail Shaker'))).toBe(true);
    });

    it('detects bar spoon from stir', () => {
      const eq = inferEquipment('Stir gently in a mixing glass', []);
      expect(eq.some((e) => e.includes('Bar Spoon'))).toBe(true);
      expect(eq.some((e) => e.includes('Mixing Glass'))).toBe(true);
    });

    it('detects muddler', () => {
      const eq = inferEquipment('Muddle the mint leaves', []);
      expect(eq.some((e) => e.includes('Muddler'))).toBe(true);
    });

    it('detects double strain', () => {
      const eq = inferEquipment('Double-strain into glass', []);
      expect(eq.some((e) => e.includes('Fine Mesh Strainer'))).toBe(true);
    });

    it('detects strainer', () => {
      const eq = inferEquipment('Strain into a chilled glass', []);
      expect(eq.some((e) => e.includes('Hawthorne Strainer'))).toBe(true);
    });

    it('detects blender', () => {
      const eq = inferEquipment('Blend with crushed ice', []);
      expect(eq.some((e) => e.includes('Blender'))).toBe(true);
    });

    it('detects citrus juicer from squeeze fresh', () => {
      const eq = inferEquipment('Squeeze fresh lime juice', []);
      expect(eq.some((e) => e.includes('Citrus Juicer'))).toBe(true);
    });

    it('detects peeler from zest', () => {
      const eq = inferEquipment('Express lemon zest over the glass', []);
      expect(eq.some((e) => e.includes('Vegetable Peeler'))).toBe(true);
    });

    it('detects torch from brûlée', () => {
      const eq = inferEquipment('Brûlée the orange peel', []);
      expect(eq.some((e) => e.includes('Kitchen Torch'))).toBe(true);
    });

    it('detects atomizer from absinthe rinse', () => {
      const eq = inferEquipment('Do an absinthe rinse in the glass', []);
      expect(eq.some((e) => e.includes('Atomizer'))).toBe(true);
    });

    it('detects ice mold from large ice', () => {
      const eq = inferEquipment('Serve over a large ice cube', []);
      expect(eq.some((e) => e.includes('Ice Mold'))).toBe(true);
    });

    it('detects jigger from ingredients', () => {
      const eq = inferEquipment('Pour carefully', ['Measure out 2 oz with a jigger']);
      expect(eq.some((e) => e.includes('Jigger'))).toBe(true);
    });

    it('returns empty when no equipment patterns match', () => {
      const eq = inferEquipment('Just drink it neat.', ['whiskey']);
      expect(eq).toEqual([]);
    });

    it('does not duplicate equipment', () => {
      const eq = inferEquipment('Shake shake shake and shake again', []);
      const shakerCount = eq.filter((e) => e.includes('Cocktail Shaker')).length;
      expect(shakerCount).toBe(1);
    });
  });

  // ── fetchYouTubeUrl ─────────────────────────────────────────────────────────
  describe('fetchYouTubeUrl', () => {
    it('returns null when no API key', async () => {
      delete process.env.YOUTUBE_API_KEY;
      const result = await fetchYouTubeUrl('Mojito');
      expect(result).toBeNull();
    });

    it('returns URL on first query success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: { videoId: 'dQw4w9WgXcQ' } }] }),
      } as any);

      const result = await fetchYouTubeUrl('Margarita');
      expect(result).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('tries second query when first fails', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: false,
          text: async () => 'error',
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [{ id: { videoId: 'xB2z4w9WgXQ' } }] }),
        } as any);

      const result = await fetchYouTubeUrl('Negroni');
      expect(result).toBe('https://www.youtube.com/watch?v=xB2z4w9WgXQ');
    });

    it('returns null when all queries fail', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      } as any);

      const result = await fetchYouTubeUrl('Unknown');
      expect(result).toBeNull();
    });

    it('handles fetch errors gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('net'));
      const result = await fetchYouTubeUrl('Fail');
      expect(result).toBeNull();
    });
  });

  // ── fetchCocktailImage ──────────────────────────────────────────────────────
  describe('fetchCocktailImage', () => {
    it('returns thumbnail on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drinks: [{ strDrinkThumb: 'https://img.jpg' }] }),
      } as any);

      const result = await fetchCocktailImage('Mojito');
      expect(result).toBe('https://img.jpg');
    });

    it('returns null when no drinks found', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drinks: null }),
      } as any);

      const result = await fetchCocktailImage('Unknown');
      expect(result).toBeNull();
    });

    it('returns null on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as any);

      const result = await fetchCocktailImage('Error');
      expect(result).toBeNull();
    });

    it('returns null on fetch error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('timeout'));
      const result = await fetchCocktailImage('Timeout');
      expect(result).toBeNull();
    });

    it('returns null when drinks[0] has no strDrinkThumb', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drinks: [{ strDrinkThumb: null }] }),
      } as any);

      const result = await fetchCocktailImage('NoThumb');
      expect(result).toBeNull();
    });
  });

  // ── proposeAddToLibrary ─────────────────────────────────────────────────────
  describe('proposeAddToLibrary', () => {
    it('returns proposed result with YouTube and image', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [{ id: { videoId: 'dQw4w9WgXcQ' } }] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drinks: [{ strDrinkThumb: 'https://img.jpg' }] }),
        } as any);

      const result = await proposeAddToLibrary.execute({
        name: 'Negroni',
        category: 'Stirred',
        baseSpirit: 'Gin',
        ingredients: ['1 oz Gin', '1 oz Campari', '1 oz Sweet Vermouth'],
        instructions: 'Stir with ice and strain into a rocks glass.',
      });

      expect(result.proposed).toBe(true);
      expect(result.cocktailName).toBe('Negroni');
      expect(result.youtubeVideoId).toBe('dQw4w9WgXcQ');
      expect(result.recipeData.imageUrl).toBe('https://img.jpg');
      expect(result.recipeData.equipment.length).toBeGreaterThan(0);
    });

    it('handles no YouTube result', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], drinks: null }),
      } as any);

      const result = await proposeAddToLibrary.execute({
        name: 'Custom',
        category: 'Other',
        baseSpirit: 'Gin',
        ingredients: ['Gin'],
        instructions: 'Pour.',
      });

      expect(result.proposed).toBe(true);
      expect(result.youtubeVideoId).toBeNull();
      expect(result.youtubeUrl).toBeNull();
    });

    it('returns null videoId when YouTube URL has no valid 11-char ID', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [{ id: { videoId: 'short' } }] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drinks: null }),
        } as any);

      const result = await proposeAddToLibrary.execute({
        name: 'Test',
        category: 'Other',
        baseSpirit: 'Gin',
        ingredients: ['Gin'],
        instructions: 'Pour.',
      });

      expect(result.proposed).toBe(true);
      expect(result.youtubeUrl).toContain('short');
      expect(result.youtubeVideoId).toBeNull();
    });
  });

  // ── addCocktailToLibrary ──────────────────────────────────────────────────
  describe('addCocktailToLibrary', () => {
    it('rejects duplicate recipes', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([{ id: 42, name: 'Negroni' }]));

      const result = await addCocktailToLibrary.execute({
        name: 'Negroni',
        category: 'Stirred',
        baseSpirit: 'Gin',
        ingredients: ['Gin'],
        instructions: 'Stir.',
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('duplicate');
    });

    it('inserts new recipe with YouTube lookup', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([])); // no duplicate
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [{ id: { videoId: 'newVideoId_1' } }] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drinks: [{ strDrinkThumb: 'https://img.jpg' }] }),
        } as any);
      (db.insert as any).mockReturnValueOnce(makeChain([{ id: 100 }]));

      const result = await addCocktailToLibrary.execute({
        name: 'New Cocktail',
        category: 'Sour',
        baseSpirit: 'Rum',
        ingredients: ['2 oz Rum', '1 oz Lime'],
        instructions: 'Shake and strain.',
      });

      expect(result.success).toBe(true);
      expect(result.recipeId).toBe(100);
      expect(result.youtubeVideoId).toBe('newVideoId_');
    });

    it('uses provided youtubeUrl instead of searching', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));
      // Only CocktailDB image fetch should happen (no YouTube search)
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drinks: null }),
      } as any);
      (db.insert as any).mockReturnValueOnce(makeChain([{ id: 101 }]));

      const result = await addCocktailToLibrary.execute({
        name: 'Pre-YT Cocktail',
        category: 'Stirred',
        baseSpirit: 'Gin',
        ingredients: ['Gin'],
        instructions: 'Stir.',
        youtubeUrl: 'https://www.youtube.com/watch?v=existingVid',
      });

      expect(result.success).toBe(true);
      expect(result.youtubeVideoId).toBe('existingVid');
    });

    it('handles no YouTube or image available', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], drinks: null }),
      } as any);
      (db.insert as any).mockReturnValueOnce(makeChain([{ id: 102 }]));

      const result = await addCocktailToLibrary.execute({
        name: 'Plain Cocktail',
        category: 'Other',
        baseSpirit: 'Vodka',
        ingredients: ['Vodka'],
        instructions: 'Pour.',
      });

      expect(result.success).toBe(true);
      expect(result.youtubeVideoId).toBeNull();
    });

    it('returns null videoId when provided youtubeUrl has no valid 11-char ID', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ drinks: null }),
      } as any);
      (db.insert as any).mockReturnValueOnce(makeChain([{ id: 103 }]));

      const result = await addCocktailToLibrary.execute({
        name: 'Bad YT',
        category: 'Other',
        baseSpirit: 'Gin',
        ingredients: ['Gin'],
        instructions: 'Pour.',
        youtubeUrl: 'https://youtube.com/channel/UCxyz',
      });

      expect(result.success).toBe(true);
      expect(result.youtubeVideoId).toBeNull();
    });
  });
});
