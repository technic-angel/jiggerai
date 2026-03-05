/**
 * Tests for agents/tools/shopping.ts — findWhereToBuy, backfillRecipeYouTube, buildRetailerLinks.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('ai', () => ({
  tool: vi.fn((config: any) => config),
}));

vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../db/schema.js', () => ({
  recipes: { id: 'id', youtubeUrl: 'youtubeUrl' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...a: any[]) => a),
}));

import { findWhereToBuy, backfillRecipeYouTube, buildRetailerLinks } from '../../agents/tools/shopping.js';
import { db } from '../../db/index.js';

function makeChain(data: any) {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    set: vi.fn(() => chain),
    then: (resolve: any) => resolve(data),
  };
  return chain;
}

describe('shopping tools', () => {
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

  // ── buildRetailerLinks ──────────────────────────────────────────────────────
  describe('buildRetailerLinks', () => {
    it('returns an array of retailer objects', () => {
      const links = buildRetailerLinks('Hendricks Gin');
      expect(links.length).toBeGreaterThanOrEqual(7);
      expect(links.every((l: any) => l.store && l.url && l.type)).toBe(true);
    });

    it('includes Google Shopping, Drizly, Total Wine, etc.', () => {
      const links = buildRetailerLinks('Campari');
      const stores = links.map((l: any) => l.store);
      expect(stores).toContain('Google Shopping');
      expect(stores).toContain('Drizly (DoorDash)');
      expect(stores).toContain('Total Wine & More');
      expect(stores).toContain('ReserveBar');
      expect(stores).toContain('BevMo!');
      expect(stores).toContain('Master of Malt');
      expect(stores).toContain('Local Liquor Stores');
      expect(stores).toContain('Amazon');
    });

    it('encodes query in URLs', () => {
      const links = buildRetailerLinks('Maker\'s Mark');
      const drizly = links.find((l: any) => l.store === 'Drizly (DoorDash)');
      expect(drizly.url).toContain(encodeURIComponent('Maker\'s Mark'));
    });
  });

  // ── findWhereToBuy ──────────────────────────────────────────────────────────
  describe('findWhereToBuy', () => {
    it('returns all retailers including local by default', async () => {
      const result = await findWhereToBuy.execute({
        ingredientName: 'Hendricks Gin',
      });

      expect(result.found).toBe(true);
      expect(result.ingredientName).toBe('Hendricks Gin');
      expect(result.bottleId).toBeNull();
      expect(result.results.some((r: any) => r.type === 'local')).toBe(true);
    });

    it('excludes local stores when includeLocalSearch is false', async () => {
      const result = await findWhereToBuy.execute({
        ingredientName: 'Campari',
        includeLocalSearch: false,
      });

      expect(result.results.every((r: any) => r.type !== 'local')).toBe(true);
    });

    it('passes bottleId through', async () => {
      const result = await findWhereToBuy.execute({
        ingredientName: 'Test',
        bottleId: 42,
      });

      expect(result.bottleId).toBe(42);
    });
  });

  // ── backfillRecipeYouTube ─────────────────────────────────────────────────
  describe('backfillRecipeYouTube', () => {
    it('returns not found when recipe does not exist', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));

      const result = await backfillRecipeYouTube.execute({ recipeId: 999, recipeName: 'Nonexistent' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('returns already-had when recipe already has a YouTube URL', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, youtubeUrl: 'https://www.youtube.com/watch?v=existingVid' },
      ]));

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Mojito' });
      expect(result.success).toBe(true);
      expect(result.alreadyHad).toBe(true);
      expect(result.youtubeVideoId).toBe('existingVid');
    });

    it('returns failure when no API key', async () => {
      delete process.env.YOUTUBE_API_KEY;
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, youtubeUrl: null },
      ]));

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Mojito' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not configured');
    });

    it('finds and saves a YouTube video', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([{ id: 1, youtubeUrl: null }]));
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            id: { videoId: 'newVideoId_' },
            snippet: { title: 'How to make Mojito' },
          }],
        }),
      } as any);
      (db.update as any).mockReturnValueOnce(makeChain(undefined));

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Mojito' });
      expect(result.success).toBe(true);
      expect(result.youtubeVideoId).toBe('newVideoId_');
      expect(result.videoTitle).toBe('How to make Mojito');
    });

    it('returns failure when YouTube search yields no results', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([{ id: 1, youtubeUrl: null }]));
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as any);

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Obscure' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Could not find');
    });

    it('returns failure when YouTube API is not OK', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([{ id: 1, youtubeUrl: null }]));
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as any);

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Fail' });
      expect(result.success).toBe(false);
    });

    it('handles fetch error (YouTube unavailable)', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([{ id: 1, youtubeUrl: null }]));
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Timeout'));

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Timeout' });
      expect(result.success).toBe(false);
    });

    it('handles YouTube URL without standard v= pattern in existing URL', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, youtubeUrl: 'https://youtu.be/shortId1234' },
      ]));

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Short' });
      expect(result.success).toBe(true);
      expect(result.youtubeVideoId).toBe('shortId1234');
    });

    it('returns null videoId when existing youtubeUrl has no valid 11-char ID', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, youtubeUrl: 'https://youtube.com/embed/ab' },
      ]));

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'Odd' });
      expect(result.success).toBe(true);
      expect(result.alreadyHad).toBe(true);
      expect(result.youtubeVideoId).toBeNull();
    });

    it('handles null videoId in YouTube search results', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([{ id: 1, youtubeUrl: null }]));
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: {}, snippet: {} }] }),
      } as any);

      const result = await backfillRecipeYouTube.execute({ recipeId: 1, recipeName: 'NoVid' });
      expect(result.success).toBe(false);
    });
  });
});
