// server/src/agents/tools/inventory.ts
//
// Tools the InventoryAgent can call to read the user's bar data.
//
// Usage: createInventoryTools(userId) — userId is bound in the closure
// so the LLM never needs to know or pass it.

import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { inventory, recipes, shoppingList } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export function createInventoryTools(userId: string) {

  const getUserInventory = tool({
    description:
      "Fetch the complete list of spirits and bottles in the user's home bar. " +
      'Returns each bottle name, category, fill level (out of 8), and unopened count. ' +
      "Call this whenever the user asks what they have, what's in their bar, or what they can make.",
    inputSchema: z.object({}),
    execute: async () => {
      const bottles = await db
        .select({
          id: inventory.id,
          name: inventory.spiritName,
          category: inventory.category,
          volumeEighths: inventory.volumeEighths,
          unopenedCount: inventory.unopenedCount,
          isFavorite: inventory.isFavorite,
          rating: inventory.rating,
        })
        .from(inventory)
        .where(eq(inventory.userId, userId))
        .orderBy(inventory.category, inventory.spiritName);

      if (bottles.length === 0) {
        return { bottles: [], summary: "The user's bar is empty — no bottles recorded yet." };
      }

      const summary = bottles
        .map((b) => {
          const fill = b.volumeEighths === 8 ? 'full' : b.volumeEighths === 0 ? 'empty' : `${b.volumeEighths}/8`;
          const reserve = b.unopenedCount > 0 ? ` + ${b.unopenedCount} unopened` : '';
          return `${b.name} (${b.category}, ${fill}${reserve})`;
        })
        .join(', ');

      return { bottles, summary: `Bar contains: ${summary}` };
    },
  });

  const getWhatICanMake = tool({
    description:
      "Find all cocktail recipes the user can make with what's currently in their bar. " +
      'Matches recipe ingredient names against the inventory using fuzzy text matching. ' +
      "Call this when the user asks 'what can I make?' or 'what cocktails can I make right now?'",
    inputSchema: z.object({}),
    execute: async () => {
      const bottles = await db
        .select({ name: inventory.spiritName })
        .from(inventory)
        .where(eq(inventory.userId, userId));

      const inStock = bottles.filter((b) => b.name).map((b) => b.name.toLowerCase());

      if (inStock.length === 0) {
        return { recipes: [], message: 'No bottles in inventory — bar is empty.' };
      }

      const allRecipes = await db
        .select({ id: recipes.id, name: recipes.name, ingredients: recipes.ingredients, baseSpirit: recipes.baseSpirit })
        .from(recipes);

      const makeable = allRecipes.filter((r) => {
        if (!r.ingredients || r.ingredients.length === 0) return false;
        const spirits = r.ingredients.filter((ing) => ing.trim().length > 4);
        return spirits.every((ing) =>
          inStock.some((bottle) =>
            bottle.includes(ing.toLowerCase()) || ing.toLowerCase().includes(bottle)
          )
        );
      });

      return {
        recipes: makeable.map((r) => ({ id: r.id, name: r.name, baseSpirit: r.baseSpirit })),
        message:
          makeable.length === 0
            ? 'No complete matches — the user may be missing one or two key ingredients.'
            : `Can make right now: ${makeable.map((r) => r.name).join(', ')}`,
      };
    },
  });

  const addToShoppingList = tool({
    description:
      "Add a bottle or ingredient to the user's shopping list. " +
      "Call this when the user wants to buy something, or when you suggest a bottle " +
      "they'd need to buy for a recipe they can't currently make.",
    inputSchema: z.object({
      itemName: z.string().describe('The bottle or ingredient to add, e.g. "Hendricks Gin"'),
    }),
    execute: async ({ itemName }) => {
      await db.insert(shoppingList).values({ userId, itemName, quantity: 1, isPurchased: 0 });
      return { success: true, message: `Added "${itemName}" to shopping list.` };
    },
  });

  return { getUserInventory, getWhatICanMake, addToShoppingList };
}
