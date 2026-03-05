import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/index.js';
import { users, inventory, recipes, shoppingList, ingredients, recipeIngredients, userFavorites, recipeSteps, recipeVariants } from './db/schema.js';
import { eq, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { runAgent } from './agents/orchestrator.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ----------------------------
// Zod Schemas
// ----------------------------
const createInventorySchema = z.object({
  userId: z.string().min(1),
  spiritName: z.string().min(1),
  category: z.string().min(1),
  volumeEighths: z.number().int().min(0).max(8).optional(),
  purchasePrice: z.union([z.number(), z.string()]).optional(),
  unopenedCount: z.number().int().min(0).max(99).optional(),
  imageUrl: z.string().url().optional(),
});

const patchInventorySchema = z.object({
  spiritName: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  volumeEighths: z.number().int().min(0).max(8).optional(),
  volumeDelta: z.number().optional(),
  unopenedCount: z.number().int().min(0).max(99).optional(),
  unopenedCountDelta: z.number().int().optional(),
  openNewBottle: z.boolean().optional(),
  openVolumeEighths: z.number().int().min(0).max(8).optional(),
  purchasePrice: z.union([z.number(), z.string()]).nullable().optional(),
  userId: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isFavorite: z.number().int().min(0).max(1).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

const patchUserSchema = z.object({
  displayName: z.string().min(1).optional(),
});

const createRecipeSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  ingredients: z.array(z.string()).min(1),
  instructions: z.string().min(1),
  baseSpirit: z.string().optional().nullable(),
  abv: z.string().optional().nullable(),
  glassType: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  imageEmoji: z.string().optional().nullable(),
  youtubeUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  equipment: z.array(z.string()).optional().nullable(),
  embedding: z.array(z.number()).optional(),
});

const patchRecipeSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

// Zod: single recipe step (used inside the bulk-add array)
const recipeStepSchema = z.object({
  stepText: z.string().min(1),
  position: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  toolRequired: z.string().optional(),
});

// Zod: create a recipe variant (the "upgrade path")
const createVariantSchema = z.object({
  variantLabel: z.string().min(1),
  variantNote: z.string().optional(),
  ingredients: z.array(z.string()).min(1),
  instructions: z.string().optional(),
  imageUrl: z.string().url().optional(),
  flavor_sweetness: z.number().min(0).max(1).optional(),
  flavor_bitterness: z.number().min(0).max(1).optional(),
  flavor_sourness: z.number().min(0).max(1).optional(),
  flavor_body: z.number().min(0).max(1).optional(),
  flavorEmbedding: z.array(z.number()).optional(),
});

// Health
app.get('/', (req, res) => res.send('Jigger AI Server is running'));

// USERS
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select().from(users).where(eq(users.id, id));
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = await patchUserSchema.safeParseAsync(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.errors });
    const rows = await db.select().from(users).where(eq(users.id, id));
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (Object.keys(parsed.data).length === 0) return res.status(400).json({ error: 'No valid fields provided to update' });
    const [updated] = await db.update(users).set(parsed.data).where(eq(users.id, id)).returning();
    res.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// INVENTORY
app.get('/api/inventory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userInventory = await db.select().from(inventory).where(eq(inventory.userId, userId));
    res.json(userInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const parsed = await createInventorySchema.parseAsync(req.body);
    const newItem = await db.insert(inventory).values({
      userId: parsed.userId,
      spiritName: parsed.spiritName,
      category: parsed.category,
      volumeEighths: typeof parsed.volumeEighths === 'number' ? parsed.volumeEighths : 8,
      purchasePrice: parsed.purchasePrice ? String(parsed.purchasePrice) : null,
      unopenedCount: typeof (req.body.unopenedCount) === 'number' ? Number(req.body.unopenedCount) : 0,
      imageUrl: parsed.imageUrl || null,
    }).returning();
    res.status(201).json(newItem[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', issues: error.errors });
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(inventory).where(eq(inventory.id, Number(id)));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

app.get('/api/inventory/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await db.select().from(inventory).where(eq(inventory.id, Number(id)));
    if (!items || items.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(items[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

app.patch('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = await patchInventorySchema.parseAsync(req.body);
    const { spiritName, category, volumeEighths, volumeDelta, purchasePrice, userId } = parsed as any;
    const items = await db.select().from(inventory).where(eq(inventory.id, Number(id)));
    if (!items || items.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    const existing = items[0]!;
    if (userId && existing.userId !== userId) return res.status(403).json({ error: 'Not authorized to modify this item' });
    const updates: any = {};
    if (typeof spiritName === 'string') updates.spiritName = spiritName;
    if (typeof category === 'string') updates.category = category;
    if (typeof purchasePrice !== 'undefined') updates.purchasePrice = purchasePrice === null ? null : String(purchasePrice);
    if (typeof volumeEighths === 'number') {
      /* v8 ignore next -- Zod already guarantees int 0-8 */
      if (!Number.isInteger(volumeEighths) || volumeEighths < 0 || volumeEighths > 8) return res.status(400).json({ error: 'volumeEighths must be an integer between 0 and 8' });
      updates.volumeEighths = volumeEighths;
    } else if (typeof volumeDelta === 'number') {
      const newVol = existing.volumeEighths + Math.trunc(volumeDelta);
      if (newVol < 0 || newVol > 8) return res.status(400).json({ error: 'Resulting volumeEighths would be out of range (0-8)' });
      updates.volumeEighths = newVol;
    }
    if (typeof parsed.unopenedCount === 'number') {
      /* v8 ignore next -- Zod already guarantees int 0-99 */
      if (!Number.isInteger(parsed.unopenedCount) || parsed.unopenedCount < 0 || parsed.unopenedCount > 99) return res.status(400).json({ error: 'unopenedCount must be integer between 0 and 99' });
      updates.unopenedCount = parsed.unopenedCount;
    }
    if (typeof parsed.unopenedCountDelta === 'number') {
      const newCount = (existing.unopenedCount || 0) + Math.trunc(parsed.unopenedCountDelta);
      if (newCount < 0 || newCount > 99) return res.status(400).json({ error: 'Resulting unopenedCount would be out of range (0-99)' });
      updates.unopenedCount = newCount;
    }
    if (parsed.openNewBottle) {
      const available = typeof updates.unopenedCount === 'number' ? updates.unopenedCount : (existing.unopenedCount || 0);
      if (available <= 0) return res.status(400).json({ error: 'No unopened bottles available to open' });
      const openVol = typeof parsed.openVolumeEighths === 'number' ? parsed.openVolumeEighths : 8;
      /* v8 ignore next -- Zod already guarantees int 0-8 */
      if (!Number.isInteger(openVol) || openVol < 0 || openVol > 8) return res.status(400).json({ error: 'openVolumeEighths must be integer between 0 and 8' });
      updates.volumeEighths = openVol;
      updates.unopenedCount = available - 1;
    }
    if (typeof parsed.isFavorite === 'number') updates.isFavorite = parsed.isFavorite;
    if (typeof parsed.rating === 'number' || parsed.rating === null) updates.rating = parsed.rating;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields provided to update' });
    updates.updatedAt = new Date();
    const updated = await db.update(inventory).set(updates).where(eq(inventory.id, Number(id))).returning();
    res.json(updated[0]);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', issues: error.errors });
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// RECIPES endpoints
app.get('/api/recipes', async (req, res) => {
  try {
    const allRecipes = await db.select().from(recipes);
    res.json(allRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.get('/api/recipes/makeable/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [userInv, allRecipes] = await Promise.all([
      db.select().from(inventory).where(eq(inventory.userId, userId)),
      db.select().from(recipes),
    ]);
    // Build a lowercase set of all spirit names + categories in the user's inventory
    const invTerms = new Set<string>();
    userInv.forEach((item: any) => {
      if (item.spiritName) item.spiritName.toLowerCase().split(/[\s,]+/).forEach((t: string) => invTerms.add(t));
      if (item.category) invTerms.add(item.category.toLowerCase());
    });
    // Strip leading measure from ingredient string: "2 oz Bourbon" -> "bourbon"
    const stripMeasure = (s: string) => s.replace(/^[\d./]+ ?(oz|tsp|tbsp|dashes?|dash|ml|cl|drops?|count|pcs?|pc) /i, '').trim().toLowerCase();
    const makeable = allRecipes.filter((r: any) => {
      const ings: string[] = Array.isArray(r.ingredients) ? r.ingredients : [];
      // Garnishes / rims / optional items don't block makeability
      const required = ings.filter((i: string) => !/(garnish|rim|twist|optional|for garnish|wedge)/i.test(i));
      if (required.length === 0) return false;
      return required.every((ing: string) => {
        const name = stripMeasure(ing);
        // Match if any word in the stripped name exists in the inventory term set
        return name.split(/\s+/).some((word: string) => word.length > 2 && invTerms.has(word));
      });
    });
    res.json(makeable);
  } catch (error) {
    console.error('Error fetching makeable recipes:', error);
    res.status(500).json({ error: 'Failed to fetch makeable recipes' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select().from(recipes).where(eq(recipes.id, Number(id)));
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(recipes).where(eq(recipes.id, Number(id)));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

app.patch('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = await patchRecipeSchema.safeParseAsync(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.errors });
    const rows = await db.select().from(recipes).where(eq(recipes.id, Number(id)));
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
    const updates: any = {};
    if (typeof parsed.data.rating === 'number' || parsed.data.rating === null) updates.rating = parsed.data.rating;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields provided to update' });
    const [updated] = await db.update(recipes).set(updates).where(eq(recipes.id, Number(id))).returning();
    res.json(updated);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// FAVORITES
app.get('/api/users/:id/favorites', async (req, res) => {
  try {
    const { id } = req.params;
    const favs = await db.select().from(userFavorites).where(eq(userFavorites.userId, id));
    const recipeIds = favs.map((f: any) => f.recipeId);
    if (recipeIds.length === 0) return res.json([]);
    const rows = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, recipeId } = req.body || {};
    if (!userId || !recipeId) return res.status(400).json({ error: 'userId and recipeId required' });
    const [row] = await db.insert(userFavorites).values({ userId, recipeId }).returning();
    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating favorite:', error);
    res.status(500).json({ error: 'Failed to create favorite' });
  }
});

app.delete('/api/favorites', async (req, res) => {
  try {
     // Prefer a non-empty `req.body`, fall back to non-empty `req.query`, else {}
     let source: any = undefined;
     if (req.body && Object.keys(req.body).length > 0) source = req.body;
     else if (req.query && Object.keys(req.query).length > 0) source = req.query;
     else source = {};
     const { userId, recipeId } = source;
    if (!userId || !recipeId) return res.status(400).json({ error: 'userId and recipeId required' });
    await db.delete(userFavorites).where(eq(userFavorites.userId, userId)).where(eq(userFavorites.recipeId, Number(recipeId)));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting favorite:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

app.post('/api/recipes', async (req, res) => {
  try {
    const parsed = await createRecipeSchema.parseAsync(req.body);
    const insertObj: any = {
      name: parsed.name,
      category: parsed.category,
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
      baseSpirit: parsed.baseSpirit ?? null,
      abv: parsed.abv ?? null,
      glassType: parsed.glassType ?? null,
      difficulty: parsed.difficulty ?? null,
      imageEmoji: parsed.imageEmoji ?? null,
      youtubeUrl: parsed.youtubeUrl || null,
      imageUrl: parsed.imageUrl || null,
      equipment: parsed.equipment ?? null,
    };
    if (Array.isArray(parsed.embedding) && parsed.embedding.length > 0) insertObj.embedding = parsed.embedding as any;
    const [newRecipe] = await db.insert(recipes).values(insertObj).returning();
    res.status(201).json(newRecipe);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', issues: error.errors });
    console.error('Error adding recipe:', error);
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

// EMBEDDING HELPERS
app.post('/api/compute-embedding', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== 'string' || text.trim().length === 0) return res.status(400).json({ error: 'Request must include `text` string' });
    const vec = new Array(768).fill(0).map((_, i) => {
      const char = text.charCodeAt(i % text.length) || 0;
      return ((char % 100) / 100) * (1 / (1 + Math.floor(i / 64)));
    });
    res.json({ embedding: vec });
  /* v8 ignore next 4 -- pure arithmetic; no realistic throw path */
  } catch (error) {
    console.error('Error computing mock embedding:', error);
    res.status(500).json({ error: 'Failed to compute embedding' });
  }
});

app.post('/api/recipes/:id/embedding', async (req, res) => {
  try {
    const { id } = req.params;
    const { embedding, flavorEmbedding } = req.body || {};
    if (!Array.isArray(embedding) && !Array.isArray(flavorEmbedding)) return res.status(400).json({ error: 'Provide `embedding` or `flavorEmbedding` array' });
    const updateObj: any = {};
    if (Array.isArray(embedding)) updateObj.embedding = embedding as any;
    if (Array.isArray(flavorEmbedding)) updateObj.flavorEmbedding = flavorEmbedding as any;
    const items = await db.select().from(recipes).where(eq(recipes.id, Number(id)));
    if (!items || items.length === 0) return res.status(404).json({ error: 'Recipe not found' });
    const [updated] = await db.update(recipes).set(updateObj).where(eq(recipes.id, Number(id))).returning();
    res.json(updated);
  } catch (error) {
    console.error('Error updating recipe embedding:', error);
    res.status(500).json({ error: 'Failed to update recipe embedding' });
  }
});

// SEARCH endpoints
app.get('/api/search/spirits', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    const userId = (req.query.userId as string) || undefined;
    if (!q) return res.status(400).json({ error: 'Missing query param `q`' });
    const results: Set<string> = new Set();
    if (userId) {
      const inv = await db.select().from(inventory).where(eq(inventory.userId, userId));
      inv.forEach((item: any) => { if (item.spiritName && item.spiritName.toLowerCase().includes(q.toLowerCase())) results.add(item.spiritName); });
    }
    const allRecipes = await db.select().from(recipes);
    allRecipes.forEach((r: any) => { (r.ingredients || []).forEach((ing: string) => { if (ing && ing.toLowerCase().includes(q.toLowerCase())) results.add(ing); }); });
    res.json(Array.from(results));
  } catch (error) {
    console.error('Error searching spirits:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/api/search/cocktails', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    if (!q) return res.status(400).json({ error: 'Missing query param `q`' });
    const allRecipes = await db.select().from(recipes);
    const matches = allRecipes.filter((r: any) => { if (r.name && r.name.toLowerCase().includes(q)) return true; if (Array.isArray(r.ingredients) && r.ingredients.some((ing: string) => ing.toLowerCase().includes(q))) return true; return false; });
    res.json(matches);
  } catch (error) {
    console.error('Error searching cocktails:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// INGREDIENTS API
app.get('/api/ingredients', async (req, res) => {
  try { const all = await db.select().from(ingredients); res.json(all); } catch (error) { console.error('Error listing ingredients:', error); res.status(500).json({ error: 'Failed to list ingredients' }); }
});

app.post('/api/ingredients', async (req, res) => {
  try {
    const { name, type, unit, category } = req.body || {};
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const [row] = await db.insert(ingredients).values({ name, type, unit: unit || null, category: category || null }).returning();
    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

app.get('/api/recipes/:id/ingredients', async (req, res) => {
  try { const { id } = req.params; const rows = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, Number(id))); res.json(rows); } catch (error) { console.error('Error fetching recipe ingredients:', error); res.status(500).json({ error: 'Failed to fetch recipe ingredients' }); }
});

app.get('/api/ingredients/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.status(400).json({ error: 'Missing query param `q`' });
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const [{ exists: hasTrgm } = { exists: false }] = await db.execute(sql`select exists (select 1 from pg_extension where extname = 'pg_trgm') as exists`);
    let rows;
    if (hasTrgm) {
      rows = await db.execute(sql`select id, name, type, category from ingredients where name %% ${q} order by similarity(name, ${q}) desc limit ${limit}`);
    } else {
      rows = await db.select().from(ingredients).where(sql`lower(${ingredients.name}) LIKE ${'%' + q.toLowerCase() + '%'}`).limit(limit);
    }
    res.json(rows);
  } catch (error) {
    console.error('Error searching ingredients:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export { app };

// ===========================================================================
// RECIPE STEPS — cached ordered instructions
// ===========================================================================

// GET: all base steps for a recipe (variantId IS NULL)
app.get('/api/recipes/:id/steps', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select().from(recipeSteps)
      .where(sql`${recipeSteps.recipeId} = ${Number(id)} AND ${recipeSteps.variantId} IS NULL`)
      .orderBy(sql`${recipeSteps.position} ASC`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recipe steps:', error);
    res.status(500).json({ error: 'Failed to fetch recipe steps' });
  }
});

// POST: bulk-add steps for a recipe (MixologistAgent caches them after a fetch)
// Body: { steps: [{stepText, position?, durationSeconds?, toolRequired?}] }
app.post('/api/recipes/:id/steps', async (req, res) => {
  try {
    const { id } = req.params;
    const { steps } = req.body || {};
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Body must include a non-empty `steps` array' });
    }
    const parsed = z.array(recipeStepSchema).safeParse(steps);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.errors });
    const rows = await db.insert(recipeSteps).values(
      parsed.data.map((s, i) => ({
        recipeId: Number(id),
        variantId: null,
        position: typeof s.position === 'number' ? s.position : i,
        stepText: s.stepText,
        durationSeconds: s.durationSeconds ?? null,
        toolRequired: s.toolRequired ?? null,
      }))
    ).returning();
    res.status(201).json(rows);
  } catch (error) {
    console.error('Error saving recipe steps:', error);
    res.status(500).json({ error: 'Failed to save recipe steps' });
  }
});

// ===========================================================================
// RECIPE VARIANTS — upgrade paths per base recipe
// ===========================================================================

// GET: all variants for a recipe (optionally include their steps)
app.get('/api/recipes/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const variants = await db.select().from(recipeVariants)
      .where(eq(recipeVariants.baseRecipeId, Number(id)));
    if (req.query.includeSteps === 'true' && variants.length > 0) {
      const variantIds = variants.map((v: any) => v.id);
      const steps = await db.select().from(recipeSteps)
        .where(sql`${recipeSteps.variantId} = ANY(${variantIds})`)
        .orderBy(sql`${recipeSteps.position} ASC`);
      const stepsByVariant: Record<number, any[]> = {};
      steps.forEach((s: any) => {
        if (!stepsByVariant[s.variantId]) stepsByVariant[s.variantId] = [];
        stepsByVariant[s.variantId].push(s);
      });
      return res.json(variants.map((v: any) => ({ ...v, steps: stepsByVariant[v.id] || [] })));
    }
    res.json(variants);
  } catch (error) {
    console.error('Error fetching recipe variants:', error);
    res.status(500).json({ error: 'Failed to fetch recipe variants' });
  }
});

// POST: create a new upgrade variant for a base recipe
app.post('/api/recipes/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = await createVariantSchema.safeParseAsync(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.errors });
    const d = parsed.data;
    const insertObj: any = {
      baseRecipeId: Number(id),
      variantLabel: d.variantLabel,
      variantNote: d.variantNote ?? null,
      ingredients: d.ingredients,
      instructions: d.instructions ?? null,
      imageUrl: d.imageUrl ?? null,
      flavor_sweetness: d.flavor_sweetness ?? null,
      flavor_bitterness: d.flavor_bitterness ?? null,
      flavor_sourness: d.flavor_sourness ?? null,
      flavor_body: d.flavor_body ?? null,
    };
    if (Array.isArray(d.flavorEmbedding) && d.flavorEmbedding.length > 0) {
      insertObj.flavorEmbedding = d.flavorEmbedding as any;
    }
    const [row] = await db.insert(recipeVariants).values(insertObj).returning();
    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating recipe variant:', error);
    res.status(500).json({ error: 'Failed to create recipe variant' });
  }
});

// GET: steps for a specific variant
app.get('/api/recipes/variants/:variantId/steps', async (req, res) => {
  try {
    const { variantId } = req.params;
    const rows = await db.select().from(recipeSteps)
      .where(eq(recipeSteps.variantId, Number(variantId)))
      .orderBy(sql`${recipeSteps.position} ASC`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching variant steps:', error);
    res.status(500).json({ error: 'Failed to fetch variant steps' });
  }
});

// POST: bulk-add steps for a specific variant
app.post('/api/recipes/variants/:variantId/steps', async (req, res) => {
  try {
    const { variantId } = req.params;
    const { steps } = req.body || {};
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Body must include a non-empty `steps` array' });
    }
    const parsed = z.array(recipeStepSchema).safeParse(steps);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.errors });
    // Resolve the recipeId from the variant row
    const variantRows = await db.select().from(recipeVariants).where(eq(recipeVariants.id, Number(variantId)));
    if (!variantRows || variantRows.length === 0) return res.status(404).json({ error: 'Variant not found' });
    const recipeId = (variantRows[0] as any).baseRecipeId;
    const rows = await db.insert(recipeSteps).values(
      parsed.data.map((s, i) => ({
        recipeId,
        variantId: Number(variantId),
        position: typeof s.position === 'number' ? s.position : i,
        stepText: s.stepText,
        durationSeconds: s.durationSeconds ?? null,
        toolRequired: s.toolRequired ?? null,
      }))
    ).returning();
    res.status(201).json(rows);
  } catch (error) {
    console.error('Error saving variant steps:', error);
    res.status(500).json({ error: 'Failed to save variant steps' });
  }
});

// GET: full recipe — base + steps + variants + variant steps (zero agent calls needed)
app.get('/api/recipes/:id/full', async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch base recipe, its steps, and its variants in parallel
    const [baseRows, baseSteps, variants] = await Promise.all([
      db.select().from(recipes).where(eq(recipes.id, Number(id))),
      db.select().from(recipeSteps)
        .where(sql`${recipeSteps.recipeId} = ${Number(id)} AND ${recipeSteps.variantId} IS NULL`)
        .orderBy(sql`${recipeSteps.position} ASC`),
      db.select().from(recipeVariants).where(eq(recipeVariants.baseRecipeId, Number(id))),
    ]);
    if (!baseRows || baseRows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
    let variantsWithSteps: any[] = variants;
    if (variants.length > 0) {
      const variantIds = variants.map((v: any) => v.id);
      const variantSteps = await db.select().from(recipeSteps)
        .where(sql`${recipeSteps.variantId} = ANY(${variantIds})`)
        .orderBy(sql`${recipeSteps.position} ASC`);
      const stepsByVariant: Record<number, any[]> = {};
      variantSteps.forEach((s: any) => {
        if (!stepsByVariant[s.variantId]) stepsByVariant[s.variantId] = [];
        stepsByVariant[s.variantId].push(s);
      });
      variantsWithSteps = variants.map((v: any) => ({ ...v, steps: stepsByVariant[v.id] || [] }));
    }
    res.json({ ...baseRows[0], steps: baseSteps, variants: variantsWithSteps });
  } catch (error) {
    console.error('Error fetching full recipe:', error);
    res.status(500).json({ error: 'Failed to fetch full recipe' });
  }
});

// ============================================
// ADK CHAT STREAMING ENDPOINT (SSE)
// ============================================

/**
 * POST /api/chat/stream
 * 
 * Streams a real-time response from Jigger using Server-Sent Events (SSE).
 * 
 * Request body:
 *   { userId, sessionId, message }
 * 
 * Response (SSE stream):
 *   data: { type: 'token', text: '...', agent: 'jigger_coordinator' }
 *   data: { type: 'token', text: '...' }
 *   ...
 *   data: { type: 'done' }
 * 
 * Error format:
 *   data: { type: 'error', message: 'Error description' }
 * 
 * The session persists across multiple messages, so the agent 
 * remembers conversation history.
 */
app.post('/api/chat/stream', async (req, res) => {
  const { userId, sessionId, message, pageContext } = req.body;

  if (!userId || !sessionId || !message) {
    return res.status(400).json({ error: 'Missing userId, sessionId, or message' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    for await (const event of runAgent(userId, sessionId, message, pageContext ?? undefined)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: String(error) })}\n\n`);
  }

  res.end();
});

// Test endpoint — quick sanity check that the LLM pipeline is working
app.post('/api/test-simple', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    for await (const event of runAgent('test-user', 'test-' + Date.now(), 'Say exactly: OK')) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (e: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`);
  }
  res.end();
});