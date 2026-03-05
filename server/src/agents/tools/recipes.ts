// server/src/agents/tools/recipes.ts
//
// Tools the RecipeAgent can call to search and retrieve cocktail recipes.
// No userId needed — recipes are global, not per-user.

import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { recipes, recipeSteps, recipeVariants } from '../../db/schema.js';
import { eq, ilike, or, sql } from 'drizzle-orm';

// ─── Search recipes by name, spirit, or keyword ───────────────────────────────
export const searchRecipes = tool({
  description:
    'Search the cocktail recipe database by name, base spirit, or category. ' +
    'Returns a list of matching recipes with basic info. ' +
    "Call this when the user asks about a specific drink, a type of cocktail, or wants to know what you can make with a spirit.",
  inputSchema: z.object({
    query: z.string().describe('Cocktail name, spirit (e.g. "gin", "rum"), or style (e.g. "sour", "tiki")'),
  }),
  execute: async ({ query }) => {
    const q = `%${query}%`;
    const results = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        category: recipes.category,
        baseSpirit: recipes.baseSpirit,
        ingredients: recipes.ingredients,
        difficulty: recipes.difficulty,
        glassType: recipes.glassType,
        imageEmoji: recipes.imageEmoji,
      })
      .from(recipes)
      .where(
        or(
          ilike(recipes.name, q),
          ilike(recipes.baseSpirit, q),
          ilike(recipes.category, q),
          sql`EXISTS (
            SELECT 1 FROM unnest(${recipes.ingredients}) AS ing
            WHERE ing ILIKE ${q}
          )`
        )
      )
      .limit(10);

    if (results.length === 0) {
      return { recipes: [], message: `No recipes found matching "${query}".` };
    }

    return {
      recipes: results.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        baseSpirit: r.baseSpirit,
        mainIngredients: r.ingredients?.slice(0, 4),
        difficulty: r.difficulty,
        glass: r.glassType,
      })),
      message: `Found ${results.length} recipe(s) matching "${query}".`,
    };
  },
});

// ─── Get full recipe details ──────────────────────────────────────────────────
export const getRecipeDetails = tool({
  description:
    'Get the complete recipe for a cocktail: full ingredient list, step-by-step instructions, glass type, and any variants. ' +
    'Call this when a user asks HOW to make a specific drink or wants the full recipe.',
  inputSchema: z.object({
    recipeId: z.number().describe('The numeric ID of the recipe from a previous searchRecipes call'),
  }),
  execute: async ({ recipeId }) => {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      return { error: `Recipe ${recipeId} not found.` };
    }

    // Get ordered steps if they exist
    const steps = await db
      .select({ position: recipeSteps.position, stepText: recipeSteps.stepText })
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, recipeId))
      .orderBy(recipeSteps.position);

    // Get any upgrade variants
    const variants = await db
      .select({ label: recipeVariants.variantLabel, note: recipeVariants.variantNote, ingredients: recipeVariants.ingredients })
      .from(recipeVariants)
      .where(eq(recipeVariants.baseRecipeId, recipeId));

    return {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      baseSpirit: recipe.baseSpirit,
      glassType: recipe.glassType,
      difficulty: recipe.difficulty,
      abv: recipe.abv,
      ingredients: recipe.ingredients,
      instructions: steps.length > 0
        ? steps.map((s) => `${s.position}. ${s.stepText}`).join('\n')
        : recipe.instructions,
      variants: variants.length > 0 ? variants : undefined,
    };
  },
});

// ─── Get recipes by base spirit ───────────────────────────────────────────────
export const getRecipesBySpirit = tool({
  description:
    'Get all recipes that use a specific base spirit. ' +
    "Useful when the user says 'I want something with gin' or 'what can I make with my tequila?'",
  inputSchema: z.object({
    spirit: z.string().describe('The base spirit, e.g. "gin", "bourbon", "tequila", "rum", "vodka"'),
  }),
  execute: async ({ spirit }) => {
    const results = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        category: recipes.category,
        ingredients: recipes.ingredients,
        difficulty: recipes.difficulty,
        imageEmoji: recipes.imageEmoji,
      })
      .from(recipes)
      .where(ilike(recipes.baseSpirit, `%${spirit}%`))
      .limit(6);

    return {
      recipes: results,
      message:
        results.length === 0
          ? `No recipes found with ${spirit} as the base spirit.`
          : `Found ${results.length} ${spirit} cocktails.`,
    };
  },
});

export const recipeTools = {
  searchRecipes,
  getRecipeDetails,
  getRecipesBySpirit,
};

// ─── Library overview + gap analysis ─────────────────────────────────────────

export const getLibraryOverview = tool({
  description:
    'Get a complete overview of every recipe currently in the Jigger.ai cocktail library. ' +
    'Returns names, categories, base spirits, and difficulty for all recipes. ' +
    'Call this before giving opinions on what to add or remove from the library.',
  inputSchema: z.object({}),
  execute: async () => {
    const all = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        category: recipes.category,
        baseSpirit: recipes.baseSpirit,
        difficulty: recipes.difficulty,
        glassType: recipes.glassType,
        ingredients: recipes.ingredients,
      })
      .from(recipes)
      .orderBy(recipes.baseSpirit, recipes.name);

    if (all.length === 0) {
      return { count: 0, recipes: [], message: 'The library is empty — no recipes yet.' };
    }

    // Build a readable summary grouped by base spirit
    const bySpirit: Record<string, string[]> = {};
    for (const r of all) {
      const key = r.baseSpirit ?? 'Other';
      if (!bySpirit[key]) bySpirit[key] = [];
      bySpirit[key]!.push(`${r.name} (${r.category}, ${r.difficulty ?? 'unknown difficulty'})`);
    }

    const summary = Object.entries(bySpirit)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([spirit, names]) => `${spirit}: ${names.join(', ')}`)
      .join('\n');

    return {
      count: all.length,
      recipes: all.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        baseSpirit: r.baseSpirit,
        difficulty: r.difficulty,
      })),
      summary,
      message: `Library has ${all.length} recipes across ${Object.keys(bySpirit).length} spirit categories.\n\n${summary}`,
    };
  },
});

export const analyzeLibraryGaps = tool({
  description:
    'Analyze the recipe library and give expert opinions on what well-known cocktails are missing, ' +
    'what duplicate or redundant recipes could be removed, and how to better balance the collection. ' +
    "Call getLibraryOverview first, then call this tool with those results to get a curated recommendation.",
  inputSchema: z.object({
    currentRecipes: z
      .array(
        z.object({
          name: z.string(),
          category: z.string().optional(),
          baseSpirit: z.string().nullable().optional(),
          difficulty: z.string().nullable().optional(),
        })
      )
      .describe('The list of recipes already in the library (from getLibraryOverview)'),
  }),
  execute: async ({ currentRecipes }) => {
    // Build sets for quick lookup
    const names = new Set(currentRecipes.map((r) => r.name.toLowerCase()));
    const spirits = new Set(currentRecipes.map((r) => (r.baseSpirit ?? '').toLowerCase()).filter(Boolean));
    const categories = new Set(currentRecipes.map((r) => (r.category ?? '').toLowerCase()).filter(Boolean));

    // Canonical cocktails every library should have, by tier
    const essentials = [
      { name: 'Old Fashioned', spirit: 'whiskey', category: 'Stirred' },
      { name: 'Negroni', spirit: 'gin', category: 'Stirred' },
      { name: 'Margarita', spirit: 'tequila', category: 'Sour' },
      { name: 'Daiquiri', spirit: 'rum', category: 'Sour' },
      { name: 'Manhattan', spirit: 'whiskey', category: 'Stirred' },
      { name: 'Martini', spirit: 'gin', category: 'Stirred' },
      { name: 'Whiskey Sour', spirit: 'whiskey', category: 'Sour' },
      { name: 'Mojito', spirit: 'rum', category: 'Highball' },
      { name: 'Moscow Mule', spirit: 'vodka', category: 'Highball' },
      { name: 'Cosmopolitan', spirit: 'vodka', category: 'Sour' },
      { name: 'Aperol Spritz', spirit: 'wine', category: 'Highball' },
      { name: 'Paloma', spirit: 'tequila', category: 'Highball' },
      { name: 'Dark & Stormy', spirit: 'rum', category: 'Highball' },
      { name: 'Espresso Martini', spirit: 'vodka', category: 'Stirred' },
      { name: 'Penicillin', spirit: 'scotch', category: 'Sour' },
      { name: 'Paper Plane', spirit: 'whiskey', category: 'Sour' },
      { name: 'Last Word', spirit: 'gin', category: 'Sour' },
      { name: 'Jungle Bird', spirit: 'rum', category: 'Tiki' },
      { name: 'French 75', spirit: 'gin', category: 'Highball' },
      { name: 'Clover Club', spirit: 'gin', category: 'Sour' },
    ];

    const missing = essentials.filter((e) => !names.has(e.name.toLowerCase()));

    // Find under-represented spirits (fewer than 2 recipes)
    const spiritCounts: Record<string, number> = {};
    currentRecipes.forEach((r) => {
      const s = (r.baseSpirit ?? 'other').toLowerCase();
      spiritCounts[s] = (spiritCounts[s] ?? 0) + 1;
    });
    const underRepresented = Object.entries(spiritCounts)
      .filter(([, count]) => count < 2)
      .map(([spirit]) => spirit);

    // Find over-represented (more than 5 in one spirit)
    const overRepresented = Object.entries(spiritCounts)
      .filter(([, count]) => count > 5)
      .map(([spirit, count]) => `${spirit} (${count} recipes)`);

    return {
      totalInLibrary: currentRecipes.length,
      missingEssentials: missing.map((m) => `${m.name} (${m.spirit}, ${m.category})`),
      underRepresentedSpirits: underRepresented,
      overRepresentedSpirits: overRepresented,
      recommendation: missing.length === 0
        ? 'Your library has all the basics covered! Consider adding craft/modern classics next.'
        : `You're missing ${missing.length} essential cocktails. Priority adds: ${missing.slice(0, 5).map((m) => m.name).join(', ')}.`,
    };
  },
});

export const libraryAnalysisTools = {
  getLibraryOverview,
  analyzeLibraryGaps,
};
