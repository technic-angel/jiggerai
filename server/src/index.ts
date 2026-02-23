import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/index.js';
import { users, inventory, recipes, shoppingList } from './db/schema.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
    const { userId, spiritName, category, volumeEighths, purchasePrice } = req.body;
    
    // Basic validation
    if (!userId || !spiritName || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newItem = await db.insert(inventory).values({
      userId,
      spiritName,
      category,
      volumeEighths: volumeEighths || 8, // Default to full bottle if not specified
      purchasePrice: purchasePrice ? String(purchasePrice) : null,
    }).returning();

    res.status(201).json(newItem[0]);
  } catch (error) {
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
    const { spiritName, category, volumeEighths, volumeDelta, purchasePrice, userId } = req.body;

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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    updates.updatedAt = new Date();

    const updated = await db.update(inventory).set(updates).where(eq(inventory.id, Number(id))).returning();
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
