import { app } from './app.js';

const port = process.env.PORT || 5000;

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
  // flavor profile fields are reserved for future use; disabled for now
  // flavor_sweetness: z.number().min(0).max(1).optional(),
  // flavor_bitterness: z.number().min(0).max(1).optional(),
  // flavor_sourness: z.number().min(0).max(1).optional(),
  // flavor_body: z.number().min(0).max(1).optional(),
});

const patchInventorySchema = z.object({
  spiritName: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  volumeEighths: z.number().int().min(0).max(8).optional(),
  volumeDelta: z.number().optional(),
  // Manage unopened bottles: set explicit count or delta, or open a new bottle
  unopenedCount: z.number().int().min(0).max(99).optional(),
  unopenedCountDelta: z.number().int().optional(),
  openNewBottle: z.boolean().optional(),
  openVolumeEighths: z.number().int().min(0).max(8).optional(),
  purchasePrice: z.union([z.number(), z.string()]).nullable().optional(),
  userId: z.string().optional(),
});

const createRecipeSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  ingredients: z.array(z.string()).min(1),
  instructions: z.string().min(1),
  youtubeUrl: z.string().url().optional(),
  // flavor attributes optional
  // flavor attributes are reserved for future use; disabled for now
  // flavor_sweetness: z.number().min(0).max(1).optional(),
  // flavor_bitterness: z.number().min(0).max(1).optional(),
  // flavor_sourness: z.number().min(0).max(1).optional(),
  // flavor_body: z.number().min(0).max(1).optional(),
  // embeddings may be provided by an agent later; accept arrays if present
  embedding: z.array(z.number()).optional(),
  // flavorEmbedding: z.array(z.number()).optional(),
});

app.get('/', (req, res) => {
  res.send('Jigger AI Server is running');
});

// ==========================================
// USERS
// ==========================================
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ==========================================
// INVENTORY
// ==========================================
app.get('/api/inventory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userInventory = await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, userId));
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
      // flavor fields intentionally omitted until DB columns are migrated in future
    }).returning();

    res.status(201).json(newItem[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: error.errors });
    }
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

// Fetch single inventory item by id
app.get('/api/inventory/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const items = await db.select().from(inventory).where(eq(inventory.id, Number(id)));
    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(items[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Partial update for inventory item
app.patch('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = await patchInventorySchema.parseAsync(req.body);
    const { spiritName, category, volumeEighths, volumeDelta, purchasePrice, userId } = parsed as any;

    const items = await db.select().from(inventory).where(eq(inventory.id, Number(id)));
    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const existing = items[0]!;

    // Optional ownership check if client provides userId
    if (userId && existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this item' });
    }

    const updates: any = {};
    if (typeof spiritName === 'string') updates.spiritName = spiritName;
    if (typeof category === 'string') updates.category = category;
    if (typeof purchasePrice !== 'undefined') updates.purchasePrice = purchasePrice === null ? null : String(purchasePrice);
    // flavor updates are intentionally disabled until the DB has flavor columns

    // Handle volume: either set absolute or apply delta
    if (typeof volumeEighths === 'number') {
      if (!Number.isInteger(volumeEighths) || volumeEighths < 0 || volumeEighths > 8) {
        return res.status(400).json({ error: 'volumeEighths must be an integer between 0 and 8' });
      }
      updates.volumeEighths = volumeEighths;
    } else if (typeof volumeDelta === 'number') {
      const newVol = existing.volumeEighths + Math.trunc(volumeDelta);
      if (newVol < 0 || newVol > 8) {
        return res.status(400).json({ error: 'Resulting volumeEighths would be out of range (0-8)' });
      }
      updates.volumeEighths = newVol;
    }

    // Handle unopened bottle operations
    if (typeof parsed.unopenedCount === 'number') {
      if (!Number.isInteger(parsed.unopenedCount) || parsed.unopenedCount < 0 || parsed.unopenedCount > 99) {
        return res.status(400).json({ error: 'unopenedCount must be integer between 0 and 99' });
      }
      updates.unopenedCount = parsed.unopenedCount;
    }

    if (typeof parsed.unopenedCountDelta === 'number') {
      const newCount = (existing.unopenedCount || 0) + Math.trunc(parsed.unopenedCountDelta);
      if (newCount < 0 || newCount > 99) {
        return res.status(400).json({ error: 'Resulting unopenedCount would be out of range (0-99)' });
      }
      updates.unopenedCount = newCount;
    }

    if (parsed.openNewBottle) {
      const available = typeof updates.unopenedCount === 'number' ? updates.unopenedCount : (existing.unopenedCount || 0);
      if (available <= 0) {
        return res.status(400).json({ error: 'No unopened bottles available to open' });
      }
      const openVol = typeof parsed.openVolumeEighths === 'number' ? parsed.openVolumeEighths : 8;
      if (!Number.isInteger(openVol) || openVol < 0 || openVol > 8) {
        return res.status(400).json({ error: 'openVolumeEighths must be integer between 0 and 8' });
      }
      updates.volumeEighths = openVol;
      updates.unopenedCount = available - 1;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    updates.updatedAt = new Date();

    const updated = await db.update(inventory).set(updates).where(eq(inventory.id, Number(id))).returning();
    res.json(updated[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: error.errors });
    }
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// ==========================================
// SEARCH ENDPOINTS
// ==========================================

// Search spirits across the user's inventory and recipe ingredients
app.get('/api/search/spirits', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    const userId = (req.query.userId as string) || undefined;

    if (!q) return res.status(400).json({ error: 'Missing query param `q`' });

    const results: Set<string> = new Set();

    if (userId) {
      const inv = await db.select().from(inventory).where(eq(inventory.userId, userId));
      inv.forEach((item: any) => {
        if (item.spiritName && item.spiritName.toLowerCase().includes(q.toLowerCase())) results.add(item.spiritName);
      });
    }

    // Search recipe ingredients
    const allRecipes = await db.select().from(recipes);
    allRecipes.forEach((r: any) => {
      (r.ingredients || []).forEach((ing: string) => {
        if (ing && ing.toLowerCase().includes(q.toLowerCase())) results.add(ing);
      });
    });

    res.json(Array.from(results));
  } catch (error) {
    console.error('Error searching spirits:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==========================================
// INGREDIENTS API
// ==========================================

// List canonical ingredients
app.get('/api/ingredients', async (req, res) => {
  try {
    const all = await db.select().from(ingredients);
    res.json(all);
  } catch (error) {
    console.error('Error listing ingredients:', error);
    res.status(500).json({ error: 'Failed to list ingredients' });
  }
});

// Create canonical ingredient
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

// Get structured ingredients for a recipe
app.get('/api/recipes/:id/ingredients', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, Number(id)));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recipe ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch recipe ingredients' });
  }
});

// Ingredient autocomplete / search
app.get('/api/ingredients/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.status(400).json({ error: 'Missing query param `q`' });
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    // If pg_trgm is available, use similarity ordering for fuzzy matches,
    // otherwise fallback to simple ILIKE.
    const [{ exists: hasTrgm } = { exists: false }] = await db.execute(sql`select exists (select 1 from pg_extension where extname = 'pg_trgm') as exists`);

    let rows;
    if (hasTrgm) {
      // Use similarity and order by it (higher first)
      rows = await db.execute(sql`
        select id, name, type, category
        from ingredients
        where name %% ${q}
        order by similarity(name, ${q}) desc
        limit ${limit}
      `);
    } else {
      rows = await db
        .select()
        .from(ingredients)
        .where(sql`lower(${ingredients.name}) LIKE ${'%' + q.toLowerCase() + '%'}`)
        .limit(limit);
    }

    res.json(rows);
  } catch (error) {
    console.error('Error searching ingredients:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search cocktails (by name or ingredient substring)
app.get('/api/search/cocktails', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    if (!q) return res.status(400).json({ error: 'Missing query param `q`' });

    const allRecipes = await db.select().from(recipes);
    const matches = allRecipes.filter((r: any) => {
      if (r.name && r.name.toLowerCase().includes(q)) return true;
      if (Array.isArray(r.ingredients) && r.ingredients.some((ing: string) => ing.toLowerCase().includes(q))) return true;
      return false;
    });

    res.json(matches);
  } catch (error) {
    console.error('Error searching cocktails:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==========================================
// ADD RECIPE (allow agents to push scraped recipes)
// ==========================================
app.post('/api/recipes', async (req, res) => {
  try {
    const parsed = await createRecipeSchema.parseAsync(req.body);

    const insertObj: any = {
      name: parsed.name,
      category: parsed.category,
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
      youtubeUrl: parsed.youtubeUrl || null,
      // flavor fields intentionally omitted until DB columns are migrated in future
    };

    // embedding and flavorEmbedding are optional; include if provided
    if (Array.isArray(parsed.embedding) && parsed.embedding.length > 0) insertObj.embedding = parsed.embedding as any;
    if (Array.isArray(parsed.flavorEmbedding) && parsed.flavorEmbedding.length > 0) insertObj.flavorEmbedding = parsed.flavorEmbedding as any;

    const [newRecipe] = await db.insert(recipes).values(insertObj).returning();
    res.status(201).json(newRecipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: error.errors });
    }
    console.error('Error adding recipe:', error);
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

// ==========================================
// EMBEDDING HELPERS (mock)
// ==========================================

// Compute a mock embedding for a given text. Replace with real model call later.
app.post('/api/compute-embedding', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Request must include `text` string' });
    }

    // Simple deterministic pseudo-embedding: map char codes into 768-d vector
    const vec = new Array(768).fill(0).map((_, i) => {
      const char = text.charCodeAt(i % text.length) || 0;
      return ((char % 100) / 100) * (1 / (1 + Math.floor(i / 64)));
    });

    res.json({ embedding: vec });
  } catch (error) {
    console.error('Error computing mock embedding:', error);
    res.status(500).json({ error: 'Failed to compute embedding' });
  }
});

// Allow updating a recipe with a computed embedding (agent can call this)
app.post('/api/recipes/:id/embedding', async (req, res) => {
  try {
    const { id } = req.params;
    const { embedding, flavorEmbedding } = req.body || {};
    if (!Array.isArray(embedding) && !Array.isArray(flavorEmbedding)) {
      return res.status(400).json({ error: 'Provide `embedding` or `flavorEmbedding` array' });
    }

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

// ==========================================
// RECIPES
// ==========================================
app.get('/api/recipes', async (req, res) => {
  try {
    const allRecipes = await db.select().from(recipes);
    res.json(allRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
