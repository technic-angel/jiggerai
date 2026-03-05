// server/src/agents/tools/shopping.ts
//
// Tools for finding where to buy spirits/ingredients.
// Generates structured retailer suggestions with real deep-link URLs
// so the user can click straight through to buy.

import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { recipes } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

// ─── Retailer link builders ────────────────────────────────────────────────────
export function buildRetailerLinks(query: string) {
  const q = encodeURIComponent(query);
  const qPlus = encodeURIComponent(query + ' buy online');

  return [
    {
      store: 'Google Shopping',
      priceRange: 'Compare prices',
      deliveryNote: 'See all retailers at once',
      url: `https://shopping.google.com/search?q=${q}+spirits`,
      logo: '🛒',
      type: 'search' as const,
    },
    {
      store: 'Drizly (DoorDash)',
      priceRange: 'Varies by location',
      deliveryNote: 'Delivery in 30–60 min',
      url: `https://www.drizly.com/search#q=${q}`,
      logo: '🚚',
      type: 'online' as const,
    },
    {
      store: 'Total Wine & More',
      priceRange: 'Competitive pricing',
      deliveryNote: 'Ship, deliver, or in-store pickup',
      url: `https://www.totalwine.com/search/all?text=${q}`,
      logo: '🍾',
      type: 'online' as const,
    },
    {
      store: 'ReserveBar',
      priceRange: 'Premium selection',
      deliveryNote: 'Ships to most US states',
      url: `https://www.reservebar.com/search?q=${q}`,
      logo: '📦',
      type: 'online' as const,
    },
    {
      store: 'BevMo!',
      priceRange: 'Regular & sale prices',
      deliveryNote: 'In-store & online ordering',
      url: `https://www.bevmo.com/search?q=${q}`,
      logo: '🏪',
      type: 'online' as const,
    },
    {
      store: 'Master of Malt',
      priceRange: 'Samples from $5',
      deliveryNote: 'Ships internationally',
      url: `https://www.masterofmalt.com/search/?q=${q}`,
      logo: '🥃',
      type: 'online' as const,
    },
    {
      store: 'Local Liquor Stores',
      priceRange: 'Varies',
      deliveryNote: 'Find stores near you',
      url: `https://www.google.com/maps/search/liquor+store+near+me`,
      logo: '📍',
      type: 'local' as const,
    },
    {
      store: 'Amazon',
      priceRange: 'Varies',
      deliveryNote: 'Note: alcohol availability varies by state',
      url: `https://www.amazon.com/s?k=${qPlus}`,
      logo: '📬',
      type: 'online' as const,
    },
  ];
}

// ─── findWhereToBuy ───────────────────────────────────────────────────────────
export const findWhereToBuy = tool({
  description:
    'Find where to buy a specific spirit or cocktail ingredient, both online and locally. ' +
    'Returns a list of retailer suggestions with direct purchase links and pricing info. ' +
    'Use this when the user asks where to buy, find, or purchase a spirit or ingredient. ' +
    'The results will be displayed in the ingredient/spirit detail view automatically.',
  inputSchema: z.object({
    ingredientName: z
      .string()
      .describe('The exact spirit or ingredient to find, e.g. "Fortaleza Tequila Blanco" or "Aperol"'),
    bottleId: z
      .number()
      .optional()
      .describe('Inventory bottle ID if the user is viewing a specific bottle (from page context)'),
    includeLocalSearch: z
      .boolean()
      .optional()
      .describe('Whether to include a local store finder link (default: true)'),
  }),
  execute: async ({ ingredientName, bottleId, includeLocalSearch = true }) => {
    const results = buildRetailerLinks(ingredientName);
    const filtered = includeLocalSearch
      ? results
      : results.filter((r) => r.type !== 'local');

    return {
      found: true,
      ingredientName,
      bottleId: bottleId ?? null,
      results: filtered,
      summary: `Found ${filtered.length} places to buy ${ingredientName}: online retailers (Drizly, Total Wine, ReserveBar, BevMo, Master of Malt) and local store finder.`,
    };
  },
});

// ─── backfillRecipeYouTube ─────────────────────────────────────────────────────
// Finds a YouTube tutorial for a recipe that doesn't have one, then saves it.
export const backfillRecipeYouTube = tool({
  description:
    'Find and save a YouTube tutorial for a recipe that is already in the library but ' +
    'does not have a YouTube video attached. Searches YouTube and updates the recipe record. ' +
    'Use this when the user is viewing a recipe without a video, or asks to find a video for a saved recipe.',
  inputSchema: z.object({
    recipeId: z.number().describe('The ID of the recipe in the library'),
    recipeName: z.string().describe('The name of the cocktail recipe'),
  }),
  execute: async ({ recipeId, recipeName }) => {
    // Check if recipe already has a URL
    const [existing] = await db
      .select({ id: recipes.id, youtubeUrl: recipes.youtubeUrl })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!existing) {
      return { success: false, message: `Recipe ID ${recipeId} not found in library.` };
    }

    if (existing.youtubeUrl) {
      const m = existing.youtubeUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      return {
        success: true,
        alreadyHad: true,
        youtubeUrl: existing.youtubeUrl,
        youtubeVideoId: m?.[1] ?? null,
        message: `"${recipeName}" already has a video attached.`,
      };
    }

    // Search YouTube
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      return { success: false, message: 'YouTube API key not configured.' };
    }

    const q = encodeURIComponent(`how to make ${recipeName} cocktail recipe`);
    const apiUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${q}&type=video&maxResults=1&key=${key}`;

    let youtubeUrl: string | null = null;
    let videoId: string | null = null;
    let videoTitle: string | null = null;

    try {
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = (await res.json()) as any;
        videoId = data.items?.[0]?.id?.videoId ?? null;
        videoTitle = data.items?.[0]?.snippet?.title ?? null;
        if (videoId) youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    } catch {
      // YouTube unavailable — don't fail the whole response
    }

    if (!youtubeUrl) {
      return {
        success: false,
        message: `Could not find a YouTube tutorial for "${recipeName}".`,
      };
    }

    // Save URL to DB (no longer set imageUrl from YouTube thumbnail — images come from CocktailDB now)
    await db
      .update(recipes)
      .set({ youtubeUrl })
      .where(eq(recipes.id, recipeId));

    return {
      success: true,
      alreadyHad: false,
      youtubeUrl,
      youtubeVideoId: videoId,
      videoTitle,
      message: `Found and saved a YouTube tutorial for "${recipeName}"! 🎬`,
    };
  },
});
