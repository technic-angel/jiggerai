/**
 * Tests for agents/tools/inventory.ts — inventory tools factory.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  tool: vi.fn((config: any) => config),
  z: undefined,
}));

vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('../../db/schema.js', () => ({
  inventory: { id: 'id', userId: 'userId', spiritName: 'spiritName', category: 'category', volumeEighths: 'volumeEighths', unopenedCount: 'unopenedCount', isFavorite: 'isFavorite', rating: 'rating' },
  recipes: { id: 'id', name: 'name', ingredients: 'ingredients', baseSpirit: 'baseSpirit' },
  shoppingList: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: any[]) => args),
}));

import { createInventoryTools } from '../../agents/tools/inventory.js';
import { db } from '../../db/index.js';

// helper to build fluent mock chain
function makeChain(data: any) {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    values: vi.fn(() => chain),
    then: (resolve: any) => resolve(data),
  };
  return chain;
}

describe('inventory tools', () => {
  const userId = 'test-user';
  let tools: ReturnType<typeof createInventoryTools>;

  beforeEach(() => {
    vi.clearAllMocks();
    tools = createInventoryTools(userId);
  });

  // ── getUserInventory ──────────────────────────────────────────────────────
  describe('getUserInventory', () => {
    it('returns empty summary when bar is empty', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([]));
      const result = await tools.getUserInventory.execute({});
      expect(result.bottles).toEqual([]);
      expect(result.summary).toContain('empty');
    });

    it('returns bottles with fill summaries', async () => {
      (db.select as any).mockReturnValueOnce(makeChain([
        { id: 1, name: 'Hendricks Gin', category: 'Gin', volumeEighths: 8, unopenedCount: 0, isFavorite: 0, rating: 4 },
        { id: 2, name: 'Maker\'s Mark', category: 'Bourbon', volumeEighths: 4, unopenedCount: 2, isFavorite: 1, rating: null },
        { id: 3, name: 'Campari', category: 'Liqueur', volumeEighths: 0, unopenedCount: 0, isFavorite: 0, rating: null },
      ]));

      const result = await tools.getUserInventory.execute({});
      expect(result.bottles).toHaveLength(3);
      expect(result.summary).toContain('full');
      expect(result.summary).toContain('4/8');
      expect(result.summary).toContain('empty');
      expect(result.summary).toContain('2 unopened');
    });
  });

  // ── getWhatICanMake ───────────────────────────────────────────────────────
  describe('getWhatICanMake', () => {
    it('returns empty when bar is empty', async () => {
      (db.select as any)
        .mockReturnValueOnce(makeChain([]));

      const result = await tools.getWhatICanMake.execute({});
      expect(result.recipes).toEqual([]);
      expect(result.message).toContain('empty');
    });

    it('returns makeable recipes', async () => {
      (db.select as any)
        .mockReturnValueOnce(makeChain([
          { name: 'Gin' },
          { name: 'Vermouth' },
          { name: 'Campari' },
        ]))
        .mockReturnValueOnce(makeChain([
          { id: 1, name: 'Negroni', ingredients: ['Gin', 'Vermouth', 'Campari'], baseSpirit: 'Gin' },
          { id: 2, name: 'Martini', ingredients: ['Gin', 'Dry Vermouth', 'Olives'], baseSpirit: 'Gin' },
        ]));

      const result = await tools.getWhatICanMake.execute({});
      expect(result.recipes.length).toBeGreaterThanOrEqual(1);
      expect(result.message).toContain('Negroni');
    });

    it('returns no matches when ingredients do not match', async () => {
      (db.select as any)
        .mockReturnValueOnce(makeChain([{ name: 'Rum' }]))
        .mockReturnValueOnce(makeChain([
          { id: 1, name: 'Negroni', ingredients: ['Gin', 'Vermouth', 'Campari'], baseSpirit: 'Gin' },
        ]));

      const result = await tools.getWhatICanMake.execute({});
      expect(result.recipes).toEqual([]);
      expect(result.message).toContain('No complete matches');
    });

    it('includes recipes where all significant ingredients match (vacuous match for short-name-only ingredients)', async () => {
      (db.select as any)
        .mockReturnValueOnce(makeChain([{ name: 'Gin' }]))
        .mockReturnValueOnce(makeChain([
          { id: 1, name: 'Empty', ingredients: [], baseSpirit: 'Gin' },
          { id: 2, name: 'Simple', ingredients: ['Gin'], baseSpirit: 'Gin' },
        ]));

      const result = await tools.getWhatICanMake.execute({});
      // "Empty" filtered out (no ingredients). "Simple" has ['Gin'] (3 chars), so
      // spirits filter removes it, [].every() = true → vacuous match.
      expect(result.recipes).toEqual([{ id: 2, name: 'Simple', baseSpirit: 'Gin' }]);
    });
  });

  // ── addToShoppingList ─────────────────────────────────────────────────────
  describe('addToShoppingList', () => {
    it('adds item successfully', async () => {
      (db.insert as any).mockReturnValueOnce(makeChain(undefined));

      const result = await tools.addToShoppingList.execute({ itemName: 'Hendricks Gin' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('Hendricks Gin');
    });
  });
});
