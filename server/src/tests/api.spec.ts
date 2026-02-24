/**
 * Comprehensive endpoint tests for Jigger AI server.
 *
 * Strategy:
 *   - The `db` Drizzle instance is fully mocked — no real Postgres needed.
 *   - Every endpoint is exercised along its success path AND every error /
 *     validation branch so that v8 coverage reports 100% for src/app.ts.
 *   - `makeChain()` creates a fluent-builder mock that mirrors the Drizzle
 *     query builder (select().from().where()…) and is also awaitable.
 */

import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import request from 'supertest';

// ---------------------------------------------------------------------------
// Mock the db module BEFORE importing the app.
// vi.mock() calls are hoisted by Vitest above all other imports.
// ---------------------------------------------------------------------------
vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

// Mock the schema so no real pg column objects are needed.
vi.mock('../db/schema.js', () => ({
  users: { id: 'id', email: 'email', displayName: 'displayName' },
  inventory: {
    id: 'id', userId: 'userId', spiritName: 'spiritName', category: 'category',
    volumeEighths: 'volumeEighths', purchasePrice: 'purchasePrice',
    unopenedCount: 'unopenedCount', name: 'name',
  },
  recipes: { id: 'id', name: 'name', embedding: 'embedding', flavorEmbedding: 'flavorEmbedding' },
  shoppingList: {},
  ingredients: { id: 'id', name: 'name', type: 'type', category: 'category' },
  recipeIngredients: { recipeId: 'recipeId' },
  userFavorites: { userId: 'userId', recipeId: 'recipeId' },
  recipeSteps: { id: 'id', recipeId: 'recipeId', variantId: 'variantId', position: 'position' },
  recipeVariants: { id: 'id', baseRecipeId: 'baseRecipeId' },
}));

// ---------------------------------------------------------------------------
// Import app + mocked db AFTER vi.mock declarations
// ---------------------------------------------------------------------------
import { app } from '../app.js';
import { db } from '../db/index.js';

// ---------------------------------------------------------------------------
// Typed helpers
// ---------------------------------------------------------------------------
const mockSelect = db.select as Mock;
const mockInsert = db.insert as Mock;
const mockUpdate = db.update as Mock;
const mockDelete = db.delete as Mock;
const mockExecute = db.execute as Mock;

/**
 * Returns a fluent Drizzle-style builder that resolves `result` when awaited.
 * Every chain method (from/where/limit/set/values) returns the same object so
 * the full builder pattern can be chained freely.
 */
function makeChain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['from', 'where', 'limit', 'set', 'values', 'orderBy']) {
    c[m] = () => c;
  }
  c.returning = () => Promise.resolve(Array.isArray(result) ? result : [result]);
  // Make the builder itself a thenable so `await db.select().from(...)` works.
  c.then = (res?: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  c.catch = (fn?: (e: unknown) => unknown) => Promise.resolve(result).catch(fn);
  return c;
}

// ---------------------------------------------------------------------------
// Shared seed fixtures
// ---------------------------------------------------------------------------
const USER = { id: 'user-1', email: 'test@test.com', displayName: 'Test' };
const INV_ITEM = {
  id: 1, userId: 'user-1', spiritName: 'Hendricks Gin', category: 'Gin',
  volumeEighths: 8, purchasePrice: '40.00', unopenedCount: 2, updatedAt: new Date(),
};
const RECIPE = {
  id: 1, name: 'Negroni', category: 'Cocktail', ingredients: ['Gin', 'Campari', 'Vermouth'],
  instructions: 'Stir', youtubeUrl: null, embedding: null,
};
const INGREDIENT = { id: 1, name: 'Dry Gin', type: 'spirit', category: 'Gin', unit: 'ml' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// GET /
// ===========================================================================
describe('GET /', () => {
  it('returns health message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Jigger AI Server');
  });
});

// ===========================================================================
// GET /api/users
// ===========================================================================
describe('GET /api/users', () => {
  it('200 – returns users array', async () => {
    mockSelect.mockReturnValueOnce(makeChain([USER]));
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/fetch users/i);
  });
});

// ===========================================================================
// GET /api/inventory/:userId
// ===========================================================================
describe('GET /api/inventory/:userId', () => {
  it('200 – returns inventory for user', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    const res = await request(app).get('/api/inventory/user-1');
    expect(res.status).toBe(200);
    expect(res.body[0].userId).toBe('user-1');
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/inventory/user-1');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/fetch inventory/i);
  });
});

// ===========================================================================
// POST /api/inventory
// ===========================================================================
describe('POST /api/inventory', () => {
  it('201 – creates item with default volumeEighths', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 8 }]));
    const res = await request(app).post('/api/inventory').send({
      userId: 'user-1', spiritName: 'Hendricks Gin', category: 'Gin', unopenedCount: 2,
    });
    expect(res.status).toBe(201);
    expect(res.body.volumeEighths).toBe(8);
  });

  it('201 – creates item with purchasePrice set (truthy branch)', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ ...INV_ITEM, purchasePrice: '45.99' }]));
    const res = await request(app).post('/api/inventory').send({
      userId: 'user-1', spiritName: 'Hendricks Gin', category: 'Gin', purchasePrice: 45.99,
    });
    expect(res.status).toBe(201);
  });

  it('201 – creates item with explicit volumeEighths', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 4 }]));
    const res = await request(app).post('/api/inventory').send({
      userId: 'user-1', spiritName: 'Hendricks Gin', category: 'Gin', volumeEighths: 4,
    });
    expect(res.status).toBe(201);
  });

  it('400 – Zod validation failure', async () => {
    const res = await request(app).post('/api/inventory').send({ spiritName: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  it('500 – db error', async () => {
    mockInsert.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).post('/api/inventory').send({
      userId: 'user-1', spiritName: 'Hendricks Gin', category: 'Gin',
    });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// DELETE /api/inventory/:id
// ===========================================================================
describe('DELETE /api/inventory/:id', () => {
  it('204 – deletes item', async () => {
    mockDelete.mockReturnValueOnce(makeChain(undefined));
    const res = await request(app).delete('/api/inventory/1');
    expect(res.status).toBe(204);
  });

  it('500 – db error', async () => {
    mockDelete.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).delete('/api/inventory/1');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/inventory/item/:id
// ===========================================================================
describe('GET /api/inventory/item/:id', () => {
  it('200 – returns item', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    const res = await request(app).get('/api/inventory/item/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('404 – not found (empty array)', async () => {
    mockSelect.mockReturnValueOnce(makeChain([]));
    const res = await request(app).get('/api/inventory/item/99');
    expect(res.status).toBe(404);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/inventory/item/1');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// PATCH /api/inventory/:id  (most complex endpoint)
// ===========================================================================
describe('PATCH /api/inventory/:id', () => {
  it('400 – Zod validation failure', async () => {
    const res = await request(app).patch('/api/inventory/1').send({ volumeEighths: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  it('500 – db error on select', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).patch('/api/inventory/1').send({ spiritName: 'NewName' });
    expect(res.status).toBe(500);
  });

  it('404 – item not found', async () => {
    mockSelect.mockReturnValueOnce(makeChain([]));
    const res = await request(app).patch('/api/inventory/1').send({ spiritName: 'NewName' });
    expect(res.status).toBe(404);
  });

  it('403 – userId mismatch', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    const res = await request(app).patch('/api/inventory/1').send({
      userId: 'other-user', spiritName: 'NewName',
    });
    expect(res.status).toBe(403);
  });

  it('400 – no valid fields provided (empty body)', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    const res = await request(app).patch('/api/inventory/1').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no valid fields/i);
  });

  it('200 – updates spiritName', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, spiritName: 'Monkey 47' }]));
    const res = await request(app).patch('/api/inventory/1').send({ spiritName: 'Monkey 47' });
    expect(res.status).toBe(200);
    expect(res.body.spiritName).toBe('Monkey 47');
  });

  it('200 – updates category', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, category: 'Whiskey' }]));
    const res = await request(app).patch('/api/inventory/1').send({ category: 'Whiskey' });
    expect(res.status).toBe(200);
  });

  it('200 – updates purchasePrice as number', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, purchasePrice: '50.00' }]));
    const res = await request(app).patch('/api/inventory/1').send({ purchasePrice: 50 });
    expect(res.status).toBe(200);
  });

  it('200 – clears purchasePrice to null', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, purchasePrice: null }]));
    const res = await request(app).patch('/api/inventory/1').send({ purchasePrice: null });
    expect(res.status).toBe(200);
  });

  it('200 – sets volumeEighths directly', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 4 }]));
    const res = await request(app).patch('/api/inventory/1').send({ volumeEighths: 4 });
    expect(res.status).toBe(200);
    expect(res.body.volumeEighths).toBe(4);
  });

  it('200 – applies volumeDelta within range', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 4 }]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 6 }]));
    const res = await request(app).patch('/api/inventory/1').send({ volumeDelta: 2 });
    expect(res.status).toBe(200);
  });

  it('400 – volumeDelta takes bottle below 0', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 2 }]));
    const res = await request(app).patch('/api/inventory/1').send({ volumeDelta: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/volumeEighths/i);
  });

  it('400 – volumeDelta takes bottle above 8', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 7 }]));
    const res = await request(app).patch('/api/inventory/1').send({ volumeDelta: 3 });
    expect(res.status).toBe(400);
  });

  it('200 – sets unopenedCount directly', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 5 }]));
    const res = await request(app).patch('/api/inventory/1').send({ unopenedCount: 5 });
    expect(res.status).toBe(200);
  });

  it('200 – applies unopenedCountDelta', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 3 }]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 5 }]));
    const res = await request(app).patch('/api/inventory/1').send({ unopenedCountDelta: 2 });
    expect(res.status).toBe(200);
  });

  it('400 – unopenedCountDelta below 0', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 0 }]));
    const res = await request(app).patch('/api/inventory/1').send({ unopenedCountDelta: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unopenedCount/i);
  });

  it('400 – unopenedCountDelta above 99', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 98 }]));
    const res = await request(app).patch('/api/inventory/1').send({ unopenedCountDelta: 5 });
    expect(res.status).toBe(400);
  });

  it('200 – openNewBottle uses existing.unopenedCount', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 2, volumeEighths: 0 }]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 8, unopenedCount: 1 }]));
    const res = await request(app).patch('/api/inventory/1').send({ openNewBottle: true });
    expect(res.status).toBe(200);
    expect(res.body.unopenedCount).toBe(1);
  });

  it('200 – openNewBottle uses updates.unopenedCount when delta already set', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 1 }]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...INV_ITEM, volumeEighths: 6, unopenedCount: 1 }]));
    const res = await request(app).patch('/api/inventory/1').send({
      openNewBottle: true,
      unopenedCountDelta: 1,
      openVolumeEighths: 6,
    });
    expect(res.status).toBe(200);
  });

  it('400 – openNewBottle but no available bottles', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...INV_ITEM, unopenedCount: 0 }]));
    const res = await request(app).patch('/api/inventory/1').send({ openNewBottle: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no unopened/i);
  });

  it('500 – db error on update', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INV_ITEM]));
    mockUpdate.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).patch('/api/inventory/1').send({ spiritName: 'X' });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/recipes
// ===========================================================================
describe('GET /api/recipes', () => {
  it('200 – returns recipe list', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// POST /api/recipes
// ===========================================================================
describe('POST /api/recipes', () => {
  const validRecipe = {
    name: 'Negroni', category: 'Cocktail',
    ingredients: ['Gin', 'Campari', 'Vermouth'],
    instructions: 'Stir equal parts',
  };

  it('201 – creates recipe without embedding', async () => {
    mockInsert.mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).post('/api/recipes').send(validRecipe);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Negroni');
  });

  it('201 – creates recipe with embedding and youtubeUrl', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ ...RECIPE, embedding: [0.1, 0.2] }]));
    const res = await request(app).post('/api/recipes').send({
      ...validRecipe,
      youtubeUrl: 'https://youtube.com/watch?v=abc123',
      embedding: [0.1, 0.2],
    });
    expect(res.status).toBe(201);
  });

  it('400 – Zod validation failure (missing name)', async () => {
    const res = await request(app).post('/api/recipes').send({ category: 'Cocktail' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  it('500 – db error', async () => {
    mockInsert.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).post('/api/recipes').send(validRecipe);
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// POST /api/compute-embedding  (100% coverage target)
// ===========================================================================
describe('POST /api/compute-embedding', () => {
  it('200 – returns 768-dimension vector for valid text', async () => {
    const res = await request(app).post('/api/compute-embedding').send({ text: 'Negroni' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.embedding)).toBe(true);
    expect(res.body.embedding).toHaveLength(768);
    expect(typeof res.body.embedding[0]).toBe('number');
  });

  it('200 – handles null byte in text (charCodeAt returns 0 path)', async () => {
    const res = await request(app).post('/api/compute-embedding').send({ text: '\u0000abc' });
    expect(res.status).toBe(200);
    expect(res.body.embedding).toHaveLength(768);
  });

  it('400 – missing text field entirely', async () => {
    const res = await request(app).post('/api/compute-embedding').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/text/i);
  });

  it('400 – text is whitespace-only string', async () => {
    const res = await request(app).post('/api/compute-embedding').send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  it('400 – text is a non-string type (number)', async () => {
    const res = await request(app).post('/api/compute-embedding').send({ text: 42 });
    expect(res.status).toBe(400);
  });

  it('400 – body is absent / non-JSON (hits req.body || {} branch)', async () => {
    const res = await request(app)
      .post('/api/compute-embedding')
      .set('Content-Type', 'text/plain')
      .send('');
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// POST /api/recipes/:id/embedding
// ===========================================================================
describe('POST /api/recipes/:id/embedding', () => {
  it('400 – neither embedding nor flavorEmbedding provided', async () => {
    const res = await request(app).post('/api/recipes/1/embedding').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/embedding/i);
  });

  it('400 – non-JSON body triggers req.body || {} fallback', async () => {
    const res = await request(app)
      .post('/api/recipes/1/embedding')
      .set('Content-Type', 'text/plain')
      .send('not-json');
    expect(res.status).toBe(400);
  });

  it('404 – recipe not found', async () => {
    mockSelect.mockReturnValueOnce(makeChain([]));
    const res = await request(app).post('/api/recipes/1/embedding').send({ embedding: [0.1] });
    expect(res.status).toBe(404);
  });

  it('200 – updates embedding only', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...RECIPE, embedding: [0.1, 0.2] }]));
    const res = await request(app).post('/api/recipes/1/embedding').send({ embedding: [0.1, 0.2] });
    expect(res.status).toBe(200);
  });

  it('200 – updates flavorEmbedding only', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    mockUpdate.mockReturnValueOnce(makeChain([{ ...RECIPE, flavorEmbedding: [0.3] }]));
    const res = await request(app).post('/api/recipes/1/embedding').send({ flavorEmbedding: [0.3] });
    expect(res.status).toBe(200);
  });

  it('200 – updates both embedding and flavorEmbedding', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    mockUpdate.mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).post('/api/recipes/1/embedding').send({
      embedding: [0.1], flavorEmbedding: [0.2],
    });
    expect(res.status).toBe(200);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).post('/api/recipes/1/embedding').send({ embedding: [0.1] });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/search/spirits
// ===========================================================================
describe('GET /api/search/spirits', () => {
  it('400 – missing q param', async () => {
    const res = await request(app).get('/api/search/spirits');
    expect(res.status).toBe(400);
  });

  it('200 – searches recipes ingredients only (no userId)', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).get('/api/search/spirits?q=Gin');
    expect(res.status).toBe(200);
    expect(res.body).toContain('Gin');
  });

  it('200 – also checks inventory when userId provided', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([INV_ITEM]))
      .mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).get('/api/search/spirits?q=Gin&userId=user-1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('200 – skips inventory item with null spiritName and recipe with null ingredients', async () => {
    // Covers: `item.spiritName &&` null guard, `r.ingredients || []`, `ing &&` null guard
    mockSelect
      .mockReturnValueOnce(makeChain([{ ...INV_ITEM, spiritName: null }]))
      .mockReturnValueOnce(makeChain([{ ...RECIPE, ingredients: null }, { ...RECIPE, ingredients: [null, 'Gin'] }]));
    const res = await request(app).get('/api/search/spirits?q=Gin&userId=user-1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/search/spirits?q=Gin');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/search/cocktails
// ===========================================================================
describe('GET /api/search/cocktails', () => {
  it('400 – missing q param', async () => {
    const res = await request(app).get('/api/search/cocktails');
    expect(res.status).toBe(400);
  });

  it('200 – matches recipe by name', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).get('/api/search/cocktails?q=negroni');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Negroni');
  });

  it('200 – matches recipe by ingredient', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).get('/api/search/cocktails?q=campari');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('200 – no matches returns empty array', async () => {
    mockSelect.mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).get('/api/search/cocktails?q=xyznomatch');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/search/cocktails?q=negroni');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/ingredients
// ===========================================================================
describe('GET /api/ingredients', () => {
  it('200 – returns list', async () => {
    mockSelect.mockReturnValueOnce(makeChain([INGREDIENT]));
    const res = await request(app).get('/api/ingredients');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/ingredients');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// POST /api/ingredients
// ===========================================================================
describe('POST /api/ingredients', () => {
  it('201 – creates ingredient with defaults', async () => {
    mockInsert.mockReturnValueOnce(makeChain([INGREDIENT]));
    const res = await request(app).post('/api/ingredients').send({
      name: 'Dry Gin', type: 'spirit',
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Dry Gin');
  });

  it('201 – creates ingredient with unit and category', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ ...INGREDIENT, unit: 'ml', category: 'Gin' }]));
    const res = await request(app).post('/api/ingredients').send({
      name: 'Dry Gin', type: 'spirit', unit: 'ml', category: 'Gin',
    });
    expect(res.status).toBe(201);
  });

  it('400 – non-JSON body triggers req.body || {} fallback', async () => {
    const res = await request(app)
      .post('/api/ingredients')
      .set('Content-Type', 'text/plain')
      .send('not-json');
    expect(res.status).toBe(400);
  });

  it('400 – missing name', async () => {
    const res = await request(app).post('/api/ingredients').send({ type: 'spirit' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name and type/i);
  });

  it('400 – missing type', async () => {
    const res = await request(app).post('/api/ingredients').send({ name: 'Gin' });
    expect(res.status).toBe(400);
  });

  it('500 – db error', async () => {
    mockInsert.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).post('/api/ingredients').send({ name: 'X', type: 'spirit' });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/recipes/:id/ingredients
// ===========================================================================
describe('GET /api/recipes/:id/ingredients', () => {
  it('200 – returns ingredient list for recipe', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ recipeId: 1, ingredientId: 1, amount: '30', unit: 'ml' }]));
    const res = await request(app).get('/api/recipes/1/ingredients');
    expect(res.status).toBe(200);
    expect(res.body[0].recipeId).toBe(1);
  });

  it('500 – db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/recipes/1/ingredients');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// GET /api/ingredients/search
// ===========================================================================
describe('GET /api/ingredients/search', () => {
  it('400 – missing q param', async () => {
    const res = await request(app).get('/api/ingredients/search');
    expect(res.status).toBe(400);
  });

  it('200 – uses ILIKE when pg_trgm not available', async () => {
    mockExecute.mockResolvedValueOnce([{ exists: false }]);
    mockSelect.mockReturnValueOnce(makeChain([INGREDIENT]));
    const res = await request(app).get('/api/ingredients/search?q=gin');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('200 – uses trigram similarity when pg_trgm available', async () => {
    mockExecute
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([INGREDIENT]);
    const res = await request(app).get('/api/ingredients/search?q=gin');
    expect(res.status).toBe(200);
  });

  it('200 – respects custom limit (capped at 50)', async () => {
    mockExecute.mockResolvedValueOnce([{ exists: false }]);
    mockSelect.mockReturnValueOnce(makeChain([INGREDIENT]));
    const res = await request(app).get('/api/ingredients/search?q=gin&limit=200');
    expect(res.status).toBe(200);
  });

  it('500 – db error', async () => {
    mockExecute.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/ingredients/search?q=gin');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// Image URL handling (inventory + recipes) and FAVORITES endpoints
// ===========================================================================
describe('Image URLs and FAVORITES', () => {
  it('POST /api/inventory accepts imageUrl and returns it', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ ...INV_ITEM, imageUrl: 'https://example.com/img.jpg' }]));
    const res = await request(app).post('/api/inventory').send({
      userId: 'user-1', spiritName: 'Hendricks Gin', category: 'Gin', imageUrl: 'https://example.com/img.jpg',
    });
    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toBe('https://example.com/img.jpg');
  });

  it('POST /api/recipes accepts imageUrl and returns it', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ ...RECIPE, imageUrl: 'https://example.com/recipe.jpg' }]));
    const res = await request(app).post('/api/recipes').send({
      name: 'Negroni', category: 'Cocktail', ingredients: ['Gin', 'Campari'], instructions: 'Stir', imageUrl: 'https://example.com/recipe.jpg',
    });
    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toBe('https://example.com/recipe.jpg');
  });

  it('GET /api/users/:id/favorites returns empty array when none', async () => {
    mockSelect.mockReturnValueOnce(makeChain([]));
    const res = await request(app).get('/api/users/user-1/favorites');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/users/:id/favorites returns recipes when present', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([{ recipeId: 1 }]))
      .mockReturnValueOnce(makeChain([RECIPE]));
    const res = await request(app).get('/api/users/user-1/favorites');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Negroni');
  });

  it('GET /api/users/:id/favorites 500 db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/users/user-1/favorites');
    expect(res.status).toBe(500);
  });

  it('POST /api/favorites creates favorite', async () => {
    mockInsert.mockReturnValueOnce(makeChain([{ userId: 'user-1', recipeId: 1 }]));
    const res = await request(app).post('/api/favorites').send({ userId: 'user-1', recipeId: 1 });
    expect(res.status).toBe(201);
  });

  it('POST /api/favorites 400 missing params', async () => {
    const res = await request(app).post('/api/favorites').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/favorites 400 with non-JSON body (req.body || {} fallback)', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .set('Content-Type', 'text/plain')
      .send('');
    expect(res.status).toBe(400);
  });

  it('POST /api/favorites 500 db error', async () => {
    mockInsert.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).post('/api/favorites').send({ userId: 'user-1', recipeId: 1 });
    expect(res.status).toBe(500);
  });

  it('DELETE /api/favorites deletes favorite via body', async () => {
    mockDelete.mockReturnValueOnce(makeChain(undefined));
    const res = await request(app).delete('/api/favorites').send({ userId: 'user-1', recipeId: 1 });
    expect(res.status).toBe(204);
  });

  it('DELETE /api/favorites deletes favorite via query when body parser skipped', async () => {
    mockDelete.mockReturnValueOnce(makeChain(undefined));
    const res = await request(app)
      .delete('/api/favorites?userId=user-1&recipeId=1')
      .set('Content-Type', 'text/plain')
      .send('');
    expect(res.status).toBe(204);
  });

  it('DELETE /api/favorites 400 missing params', async () => {
    const res = await request(app).delete('/api/favorites').send({});
    expect(res.status).toBe(400);
  });

  it('DELETE /api/favorites 400 when body parser skipped and no query', async () => {
    const res = await request(app)
      .delete('/api/favorites')
      .set('Content-Type', 'text/plain')
      .send('');
    expect(res.status).toBe(400);
  });

  it('DELETE /api/favorites 500 db error', async () => {
    mockDelete.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).delete('/api/favorites').send({ userId: 'user-1', recipeId: 1 });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// RECIPE STEPS  GET/POST /api/recipes/:id/steps
// ===========================================================================
const STEP = { id: 1, recipeId: 1, variantId: null, position: 0, stepText: 'Shake well', durationSeconds: 30, toolRequired: 'shaker' };
const VARIANT = { id: 1, baseRecipeId: 1, variantLabel: 'Grand Marnier Upgrade', variantNote: 'Premium', ingredients: ['Grand Marnier'], instructions: 'Stir', imageUrl: null };

describe('RECIPE STEPS', () => {
  it('GET /api/recipes/:id/steps returns steps', async () => {
    mockSelect.mockReturnValueOnce(makeChain([STEP]));
    const res = await request(app).get('/api/recipes/1/steps');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/recipes/:id/steps 500 db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/recipes/1/steps');
    expect(res.status).toBe(500);
  });

  it('POST /api/recipes/:id/steps creates steps', async () => {
    mockInsert.mockReturnValueOnce(makeChain([STEP]));
    const res = await request(app)
      .post('/api/recipes/1/steps')
      .send({ steps: [{ stepText: 'Shake well', position: 0, durationSeconds: 30, toolRequired: 'shaker' }] });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/recipes/:id/steps 400 missing steps array', async () => {
    const res = await request(app).post('/api/recipes/1/steps').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/:id/steps 400 with non-JSON body (req.body || {} fallback)', async () => {
    const res = await request(app)
      .post('/api/recipes/1/steps')
      .set('Content-Type', 'text/plain')
      .send('');
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/:id/steps 400 empty steps array', async () => {
    const res = await request(app).post('/api/recipes/1/steps').send({ steps: [] });
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/:id/steps 400 validation failure', async () => {
    const res = await request(app).post('/api/recipes/1/steps').send({ steps: [{ position: 0 }] });
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/:id/steps creates steps without position field (uses index fallback)', async () => {
    mockInsert.mockReturnValueOnce(makeChain([STEP]));
    const res = await request(app)
      .post('/api/recipes/1/steps')
      .send({ steps: [{ stepText: 'Shake well' }] }); // no position → triggers ternary false branch
    expect(res.status).toBe(201);
  });

  it('POST /api/recipes/:id/steps 500 db error', async () => {
    mockInsert.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app)
      .post('/api/recipes/1/steps')
      .send({ steps: [{ stepText: 'Shake well' }] });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// RECIPE VARIANTS  GET/POST /api/recipes/:id/variants
// ===========================================================================
describe('RECIPE VARIANTS', () => {
  it('GET /api/recipes/:id/variants returns variants', async () => {
    mockSelect.mockReturnValueOnce(makeChain([VARIANT]));
    const res = await request(app).get('/api/recipes/1/variants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/recipes/:id/variants with includeSteps=true and no variants returns []', async () => {
    mockSelect.mockReturnValueOnce(makeChain([]));
    const res = await request(app).get('/api/recipes/1/variants?includeSteps=true');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/recipes/:id/variants with includeSteps=true fetches steps', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([VARIANT]))
      .mockReturnValueOnce(makeChain([{ ...STEP, variantId: 1 }]));
    const res = await request(app).get('/api/recipes/1/variants?includeSteps=true');
    expect(res.status).toBe(200);
    expect(res.body[0].steps).toBeDefined();
  });

  it('GET /api/recipes/:id/variants with includeSteps=true and variant has no steps ([] fallback)', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([VARIANT]))  // variants non-empty → enters includeSteps block
      .mockReturnValueOnce(makeChain([]));        // steps select returns empty → stepsByVariant[v.id] undefined → []
    const res = await request(app).get('/api/recipes/1/variants?includeSteps=true');
    expect(res.status).toBe(200);
    expect(res.body[0].steps).toEqual([]);
  });

  it('POST /api/recipes/:id/variants 400 with non-JSON body (req.body || {} fallback)', async () => {
    const res = await request(app)
      .post('/api/recipes/1/variants')
      .set('Content-Type', 'text/plain')
      .send(''); // body will be undefined → req.body || {}
    expect(res.status).toBe(400);
  });

  it('GET /api/recipes/:id/variants 500 db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/recipes/1/variants');
    expect(res.status).toBe(500);
  });

  it('POST /api/recipes/:id/variants creates variant', async () => {
    mockInsert.mockReturnValueOnce(makeChain([VARIANT]));
    const res = await request(app)
      .post('/api/recipes/1/variants')
      .send({ variantLabel: 'Grand Marnier Upgrade', ingredients: ['Grand Marnier'] });
    expect(res.status).toBe(201);
  });

  it('POST /api/recipes/:id/variants with all optional fields', async () => {
    mockInsert.mockReturnValueOnce(makeChain([VARIANT]));
    const res = await request(app)
      .post('/api/recipes/1/variants')
      .send({
        variantLabel: 'Premium', variantNote: 'nice', ingredients: ['Whiskey'],
        instructions: 'Stir', imageUrl: 'http://img.com/v.jpg',
        flavor_sweetness: 0.5, flavor_bitterness: 0.3, flavor_sourness: 0.2, flavor_body: 0.4,
        flavorEmbedding: [0.1, 0.2, 0.3],
      });
    expect(res.status).toBe(201);
  });

  it('POST /api/recipes/:id/variants 400 validation failure', async () => {
    const res = await request(app).post('/api/recipes/1/variants').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/:id/variants 500 db error', async () => {
    mockInsert.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app)
      .post('/api/recipes/1/variants')
      .send({ variantLabel: 'Grand Marnier Upgrade', ingredients: ['Grand Marnier'] });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// VARIANT STEPS  GET/POST /api/recipes/variants/:variantId/steps
// ===========================================================================
describe('VARIANT STEPS', () => {
  it('GET /api/recipes/variants/:variantId/steps returns steps', async () => {
    mockSelect.mockReturnValueOnce(makeChain([{ ...STEP, variantId: 1 }]));
    const res = await request(app).get('/api/recipes/variants/1/steps');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/recipes/variants/:variantId/steps 500 db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/recipes/variants/1/steps');
    expect(res.status).toBe(500);
  });

  it('POST /api/recipes/variants/:variantId/steps creates steps', async () => {
    mockSelect.mockReturnValueOnce(makeChain([VARIANT]));
    mockInsert.mockReturnValueOnce(makeChain([{ ...STEP, variantId: 1 }]));
    const res = await request(app)
      .post('/api/recipes/variants/1/steps')
      .send({ steps: [{ stepText: 'Stir for 30s', position: 0 }] });
    expect(res.status).toBe(201);
  });

  it('POST /api/recipes/variants/:variantId/steps 404 variant not found', async () => {
    mockSelect.mockReturnValueOnce(makeChain([]));
    const res = await request(app)
      .post('/api/recipes/variants/99/steps')
      .send({ steps: [{ stepText: 'Stir' }] });
    expect(res.status).toBe(404);
  });

  it('POST /api/recipes/variants/:variantId/steps 400 missing steps', async () => {
    const res = await request(app).post('/api/recipes/variants/1/steps').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/variants/:variantId/steps 400 empty steps', async () => {
    const res = await request(app).post('/api/recipes/variants/1/steps').send({ steps: [] });
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/variants/:variantId/steps 400 validation failure', async () => {
    const res = await request(app).post('/api/recipes/variants/1/steps').send({ steps: [{ position: 0 }] });
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/variants/:variantId/steps with non-JSON body (req.body || {} fallback)', async () => {
    const res = await request(app)
      .post('/api/recipes/variants/1/steps')
      .set('Content-Type', 'text/plain')
      .send('');
    expect(res.status).toBe(400);
  });

  it('POST /api/recipes/variants/:variantId/steps creates steps without position (index fallback)', async () => {
    mockSelect.mockReturnValueOnce(makeChain([VARIANT]));
    mockInsert.mockReturnValueOnce(makeChain([{ ...STEP, variantId: 1 }]));
    const res = await request(app)
      .post('/api/recipes/variants/1/steps')
      .send({ steps: [{ stepText: 'Stir' }] }); // no position → triggers ternary false branch
    expect(res.status).toBe(201);
  });

  it('POST /api/recipes/variants/:variantId/steps 500 db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app)
      .post('/api/recipes/variants/1/steps')
      .send({ steps: [{ stepText: 'Stir' }] });
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// FULL RECIPE  GET /api/recipes/:id/full
// ===========================================================================
describe('FULL RECIPE', () => {
  it('GET /api/recipes/:id/full returns recipe with steps and variants', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([RECIPE]))
      .mockReturnValueOnce(makeChain([STEP]))
      .mockReturnValueOnce(makeChain([]));
    const res = await request(app).get('/api/recipes/1/full');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Negroni');
    expect(Array.isArray(res.body.steps)).toBe(true);
    expect(Array.isArray(res.body.variants)).toBe(true);
  });

  it('GET /api/recipes/:id/full fetches variant steps when variants exist', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([RECIPE]))
      .mockReturnValueOnce(makeChain([STEP]))
      .mockReturnValueOnce(makeChain([VARIANT]))
      .mockReturnValueOnce(makeChain([{ ...STEP, variantId: 1 }]));
    const res = await request(app).get('/api/recipes/1/full');
    expect(res.status).toBe(200);
    expect(res.body.variants[0].steps).toBeDefined();
  });

  it('GET /api/recipes/:id/full with variants but no variant steps ([] fallback)', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([RECIPE]))
      .mockReturnValueOnce(makeChain([STEP]))
      .mockReturnValueOnce(makeChain([VARIANT]))  // variants non-empty → fetches variant steps
      .mockReturnValueOnce(makeChain([]));        // no variant steps → stepsByVariant[v.id] undefined → []
    const res = await request(app).get('/api/recipes/1/full');
    expect(res.status).toBe(200);
    expect(res.body.variants[0].steps).toEqual([]);
  });

  it('GET /api/recipes/:id/full 404 recipe not found', async () => {
    mockSelect
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));
    const res = await request(app).get('/api/recipes/99/full');
    expect(res.status).toBe(404);
  });

  it('GET /api/recipes/:id/full 500 db error', async () => {
    mockSelect.mockImplementationOnce(() => { throw new Error('DB down'); });
    const res = await request(app).get('/api/recipes/1/full');
    expect(res.status).toBe(500);
  });
});
