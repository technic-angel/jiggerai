// server/src/mcp-server.ts
//
// Jigger.ai MCP Server — exposes the cocktail library and inventory as
// Model Context Protocol tools so any MCP-compatible client (Claude Desktop,
// Cursor, VS Code Copilot, etc.) can read and update the Jigger data.
//
// Transport: stdio (standard for local MCP servers)
// Run with: npm run mcp  (or npx tsx src/mcp-server.ts)

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { db } from './db/index.js';
import {
  recipes,
  inventory,
  recipeSteps,
  recipeVariants,
  shoppingList,
} from './db/schema.js';
import { eq, ilike, or, sql } from 'drizzle-orm';

dotenv.config();

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_library',
    description:
      'Get a complete list of all cocktail recipes in the Jigger.ai library, grouped by base spirit. ' +
      'Returns id, name, category, baseSpirit, difficulty, and ingredient count for each recipe.',
    inputSchema: {
      type: 'object',
      properties: {
        spirit: {
          type: 'string',
          description: 'Optional: filter by base spirit (e.g. "gin", "rum", "whiskey")',
        },
      },
    },
  },
  {
    name: 'get_recipe',
    description:
      'Get the full recipe details for a specific cocktail by ID: ingredients, instructions, steps, glass type, ABV, YouTube URL.',
    inputSchema: {
      type: 'object',
      properties: {
        recipeId: {
          type: 'number',
          description: 'The numeric recipe ID (from get_library)',
        },
      },
      required: ['recipeId'],
    },
  },
  {
    name: 'search_recipes',
    description:
      'Search the recipe library by cocktail name, ingredient, or style keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term: cocktail name, spirit, or style (e.g. "sour", "tequila", "Old Fashioned")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_inventory',
    description:
      'Get the bar inventory for a user — what bottles they have, how full each is, and which are favorites.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The user ID. Defaults to "dev-user-001" for local dev.',
        },
      },
    },
  },
  {
    name: 'analyze_library',
    description:
      'Analyze the recipe library and return: total count, breakdown by spirit, ' +
      'list of missing essential classics, under-represented spirits, and a priority recommendation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'add_recipe',
    description:
      'Add a new cocktail recipe to the Jigger.ai library.',
    inputSchema: {
      type: 'object',
      properties: {
        name:         { type: 'string', description: 'Cocktail name' },
        category:     { type: 'string', description: 'Style (e.g. "Sour", "Highball", "Stirred")' },
        baseSpirit:   { type: 'string', description: 'Primary spirit (e.g. "Gin")' },
        ingredients:  { type: 'array', items: { type: 'string' }, description: 'List of ingredients with amounts' },
        instructions: { type: 'string', description: 'How to make the drink' },
        glassType:    { type: 'string', description: 'Serving glass (optional)' },
        difficulty:   { type: 'string', description: 'Easy / Medium / Advanced (optional)' },
        abv:          { type: 'string', description: 'Approximate ABV (optional)' },
        imageEmoji:   { type: 'string', description: 'Single emoji (optional)' },
        youtubeUrl:   { type: 'string', description: 'YouTube tutorial URL (optional)' },
      },
      required: ['name', 'category', 'ingredients', 'instructions'],
    },
  },
  {
    name: 'delete_recipe',
    description: 'Remove a recipe from the library by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        recipeId: { type: 'number', description: 'The recipe ID to delete' },
      },
      required: ['recipeId'],
    },
  },
  {
    name: 'get_shopping_list',
    description: "Get the user's shopping list — items the user wants to buy for their bar.",
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID. Defaults to "dev-user-001".' },
      },
    },
  },
] as const;

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function handleGetLibrary(args: Record<string, unknown>) {
  const spirit = typeof args.spirit === 'string' ? args.spirit : undefined;

  const rows = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      category: recipes.category,
      baseSpirit: recipes.baseSpirit,
      difficulty: recipes.difficulty,
      ingredientCount: sql<number>`array_length(${recipes.ingredients}, 1)`,
      imageEmoji: recipes.imageEmoji,
      youtubeUrl: recipes.youtubeUrl,
    })
    .from(recipes)
    .where(spirit ? ilike(recipes.baseSpirit, `%${spirit}%`) : undefined)
    .orderBy(recipes.baseSpirit, recipes.name);

  // Group by spirit
  const bySpirit: Record<string, typeof rows> = {};
  for (const r of rows) {
    const key = r.baseSpirit ?? 'Other';
    if (!bySpirit[key]) bySpirit[key] = [];
    bySpirit[key]!.push(r);
  }

  return {
    totalRecipes: rows.length,
    bySpirit: Object.fromEntries(
      Object.entries(bySpirit).sort(([a], [b]) => a.localeCompare(b))
    ),
  };
}

async function handleGetRecipe(args: Record<string, unknown>) {
  const recipeId = Number(args.recipeId);
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (!recipe) return { error: `Recipe ${recipeId} not found` };

  const [steps, variants] = await Promise.all([
    db.select({ position: recipeSteps.position, stepText: recipeSteps.stepText })
      .from(recipeSteps)
      .where(sql`${recipeSteps.recipeId} = ${recipeId} AND ${recipeSteps.variantId} IS NULL`)
      .orderBy(recipeSteps.position),
    db.select().from(recipeVariants).where(eq(recipeVariants.baseRecipeId, recipeId)),
  ]);

  return {
    ...recipe,
    steps,
    variants: variants.map((v) => ({
      label: v.variantLabel,
      note: v.variantNote,
      ingredients: v.ingredients,
    })),
  };
}

async function handleSearchRecipes(args: Record<string, unknown>) {
  const query = String(args.query ?? '');
  const q = `%${query}%`;
  return await db
    .select({ id: recipes.id, name: recipes.name, category: recipes.category, baseSpirit: recipes.baseSpirit, difficulty: recipes.difficulty })
    .from(recipes)
    .where(
      or(
        ilike(recipes.name, q),
        ilike(recipes.baseSpirit, q),
        ilike(recipes.category, q),
        sql`EXISTS (SELECT 1 FROM unnest(${recipes.ingredients}) AS ing WHERE ing ILIKE ${q})`
      )
    )
    .limit(15);
}

async function handleGetInventory(args: Record<string, unknown>) {
  const userId = typeof args.userId === 'string' ? args.userId : 'dev-user-001';
  const bottles = await db.select().from(inventory).where(eq(inventory.userId, userId)).orderBy(inventory.category, inventory.spiritName);
  return {
    userId,
    bottleCount: bottles.length,
    bottles: bottles.map((b) => ({
      id: b.id,
      name: b.spiritName,
      category: b.category,
      fill: `${b.volumeEighths}/8`,
      unopened: b.unopenedCount,
      isFavorite: Boolean(b.isFavorite),
    })),
  };
}

async function handleAnalyzeLibrary() {
  const all = await db
    .select({ name: recipes.name, category: recipes.category, baseSpirit: recipes.baseSpirit, difficulty: recipes.difficulty })
    .from(recipes);

  const spiritCounts: Record<string, number> = {};
  for (const r of all) {
    const s = (r.baseSpirit ?? 'other').toLowerCase();
    spiritCounts[s] = (spiritCounts[s] ?? 0) + 1;
  }

  const names = new Set(all.map((r) => r.name.toLowerCase()));
  const essentials = ['Old Fashioned','Negroni','Margarita','Daiquiri','Manhattan','Martini','Whiskey Sour','Mojito','Moscow Mule','Cosmopolitan','Aperol Spritz','Paloma','Espresso Martini','Penicillin','Paper Plane','Last Word','French 75','Jungle Bird'];
  const missing = essentials.filter((n) => !names.has(n.toLowerCase()));

  const under = Object.entries(spiritCounts).filter(([, c]) => c < 2).map(([s]) => s);
  const over  = Object.entries(spiritCounts).filter(([, c]) => c > 5).map(([s, c]) => `${s} (${c})`);

  return {
    totalRecipes: all.length,
    spiritBreakdown: spiritCounts,
    missingEssentials: missing,
    underRepresentedSpirits: under,
    overRepresentedSpirits: over,
    priorityAdditions: missing.slice(0, 5),
    recommendation: missing.length === 0
      ? 'All essentials covered! Consider adding modern craft classics.'
      : `Add ${missing.length} missing classics. Start with: ${missing.slice(0, 3).join(', ')}.`,
  };
}

async function handleAddRecipe(args: Record<string, unknown>) {
  const { name, category, baseSpirit, ingredients, instructions, glassType, difficulty, abv, imageEmoji, youtubeUrl } = args as any;
  const [inserted] = await db.insert(recipes).values({
    name, category,
    baseSpirit: baseSpirit ?? null,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    instructions,
    glassType: glassType ?? null,
    difficulty: difficulty ?? null,
    abv: abv ?? null,
    imageEmoji: imageEmoji ?? '🍸',
    youtubeUrl: youtubeUrl ?? null,
  }).returning({ id: recipes.id, name: recipes.name });
  return { success: true, ...inserted };
}

async function handleDeleteRecipe(args: Record<string, unknown>) {
  const recipeId = Number(args.recipeId);
  const [deleted] = await db.delete(recipes).where(eq(recipes.id, recipeId)).returning({ name: recipes.name });
  return deleted ? { success: true, deleted: deleted.name } : { success: false, error: 'Recipe not found' };
}

async function handleGetShoppingList(args: Record<string, unknown>) {
  const userId = typeof args.userId === 'string' ? args.userId : 'dev-user-001';
  return await db.select().from(shoppingList).where(eq(shoppingList.userId, userId));
}

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'jigger-ai', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'get_library':      result = await handleGetLibrary(args);      break;
      case 'get_recipe':       result = await handleGetRecipe(args);        break;
      case 'search_recipes':   result = await handleSearchRecipes(args);    break;
      case 'get_inventory':    result = await handleGetInventory(args);     break;
      case 'analyze_library':  result = await handleAnalyzeLibrary();       break;
      case 'add_recipe':       result = await handleAddRecipe(args);        break;
      case 'delete_recipe':    result = await handleDeleteRecipe(args);     break;
      case 'get_shopping_list':result = await handleGetShoppingList(args);  break;
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Error: ${err?.message ?? String(err)}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[jigger-mcp] MCP server running on stdio');
