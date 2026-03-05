// server/src/agents/tools/cocktaildb.ts
//
// Tools that query TheCocktailDB public API (no key needed).
// Used as a fallback when a recipe isn't found in the local DB.
//
// API reference: https://www.thecocktaildb.com/api/json/v1/1/

import { tool } from 'ai';
import { z } from 'zod';

const BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

// ─── Parse raw CocktailDB drink object into a clean shape ─────────────────────
export function parseDrink(d: Record<string, any>) {
  // Collect ingredients + measures (up to 15 slots, skip nulls)
  const ingredients: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const ing = d[`strIngredient${i}`]?.trim();
    if (!ing) break;
    const measure = d[`strMeasure${i}`]?.trim() ?? '';
    ingredients.push(measure ? `${measure} ${ing}` : ing);
  }

  return {
    source: 'thecocktaildb',
    id: d.idDrink as string,
    name: d.strDrink as string,
    category: d.strCategory as string ?? null,
    alcoholic: d.strAlcoholic as string ?? null,
    glassType: d.strGlass as string ?? null,
    instructions: d.strInstructions as string ?? null,
    ingredients,
    thumbnail: d.strDrinkThumb as string ?? null,
  };
}

// ─── lookupCocktailDB ─────────────────────────────────────────────────────────
// Searches TheCocktailDB by exact or partial cocktail name.
export const lookupCocktailDB = tool({
  description:
    'Search TheCocktailDB (thecocktaildb.com) for a cocktail recipe by name. ' +
    'Use this when the recipe is NOT in the local database. ' +
    'Returns full ingredients, measurements, and step-by-step instructions.',
  inputSchema: z.object({
    cocktailName: z.string().describe('The name of the cocktail to search for'),
  }),
  execute: async ({ cocktailName }) => {
    try {
      const url = `${BASE_URL}/search.php?s=${encodeURIComponent(cocktailName)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

      if (!res.ok) {
        return { found: false, message: `CocktailDB returned status ${res.status}.` };
      }

      const data = (await res.json()) as { drinks: Record<string, any>[] | null };

      if (!data.drinks || data.drinks.length === 0) {
        return { found: false, message: `"${cocktailName}" was not found in TheCocktailDB.` };
      }

      // Return the best match (first result) plus up to 4 alternatives
      const [best, ...others] = data.drinks.map(parseDrink);
      return {
        found: true,
        recipe: best,
        alternatives: others.slice(0, 4).map((d) => ({ id: d.id, name: d.name })),
      };
    } catch (err: unknown) {
      return {
        found: false,
        message: `Failed to reach TheCocktailDB: ${(err as any)?.message ?? String(err)}`,
      };
    }
  },
});

// ─── findCocktailVariations ───────────────────────────────────────────────────
// Searches TheCocktailDB for cocktails with the same base ingredients/style,
// then the model can supplement with its own variation knowledge.
export const findCocktailVariations = tool({
  description:
    'Find variations and riffs on a cocktail. First searches TheCocktailDB for drinks ' +
    'that share the same base spirit or flavour profile, then use your own knowledge to ' +
    'suggest creative twists. Use this when the user asks for variations, riffs, twists, ' +
    'or modifications of a specific cocktail.',
  inputSchema: z.object({
    cocktailName: z.string().describe('The base cocktail name (e.g. "Margarita", "Old Fashioned")'),
    baseSpirit: z.string().optional().describe('The primary spirit in the cocktail (e.g. "tequila", "bourbon")'),
  }),
  execute: async ({ cocktailName, baseSpirit }) => {
    try {
      const results: Record<string, any>[] = [];

      // 1. Search by spirit (ingredient filter)
      if (baseSpirit) {
        const spiritUrl = `${BASE_URL}/filter.php?i=${encodeURIComponent(baseSpirit)}`;
        const spiritRes = await fetch(spiritUrl, { signal: AbortSignal.timeout(6000) });
        if (spiritRes.ok) {
          const spiritData = (await spiritRes.json()) as { drinks: Record<string, any>[] | null };
          if (spiritData.drinks) {
            // Pick up to 8 random cocktails with that spirit, excluding the base drink
            const filtered = spiritData.drinks
              .filter((d) => d.strDrink?.toLowerCase() !== cocktailName.toLowerCase())
              .slice(0, 8);
            results.push(...filtered);
          }
        }
      }

      // 2. Also search by name to find known variants (e.g. "Frozen Margarita")
      const nameUrl = `${BASE_URL}/search.php?s=${encodeURIComponent(cocktailName)}`;
      const nameRes = await fetch(nameUrl, { signal: AbortSignal.timeout(6000) });
      if (nameRes.ok) {
        const nameData = (await nameRes.json()) as { drinks: Record<string, any>[] | null };
        if (nameData.drinks) {
          // Exclude exact match, keep variants that contain the base name
          const variants = nameData.drinks
            .filter((d) => d.strDrink?.toLowerCase() !== cocktailName.toLowerCase())
            .slice(0, 5);
          results.push(...variants);
        }
      }

      const uniqueNames = new Set<string>();
      const unique = results.filter((d) => {
        if (!d.strDrink || uniqueNames.has(d.strDrink)) return false;
        uniqueNames.add(d.strDrink);
        return true;
      });

      return {
        baseCocktail: cocktailName,
        dbVariations: unique.slice(0, 6).map((d) => ({
          name: d.strDrink as string,
          id: d.idDrink as string,
          thumbnail: d.strDrinkThumb as string ?? null,
        })),
        message: unique.length > 0
          ? `Found ${unique.length} related cocktails in TheCocktailDB.`
          : `No exact variants found in TheCocktailDB — using model knowledge for variations.`,
      };
    } catch (err: unknown) {
      return {
        baseCocktail: cocktailName,
        dbVariations: [],
        message: `TheCocktailDB unavailable: ${(err as any)?.message ?? String(err)}`,
      };
    }
  },
});
