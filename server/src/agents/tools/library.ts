// server/src/agents/tools/library.ts
//
// Two tools for adding cocktails to the Jigger.ai recipe library:
//
//  proposeAddToLibrary  — purely a signal: the LLM calls this after
//                         suggesting a drink so the frontend can render
//                         an "Add to Library" button. No DB writes.
//
//  addCocktailToLibrary — actually inserts the recipe into the DB.
//                         Automatically searches YouTube and attaches
//                         a video URL if one is found.

import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { recipes } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

// ─── Shared recipe schema ────────────────────────────────────────────────────
// The LLM fills every field; optional ones get sane defaults.
const recipeInputSchema = z.object({
  name: z
    .string()
    .describe('The full name of the cocktail, e.g. "Cucumber Gimlet"'),
  category: z
    .string()
    .describe('Style category, e.g. "Sour", "Highball", "Stirred", "Tiki"'),
  baseSpirit: z
    .string()
    .describe('Primary base spirit, e.g. "Gin", "Rum", "Whiskey"'),
  ingredients: z
    .array(z.string())
    .describe('List of ingredients with amounts, e.g. ["2 oz Gin", "¾ oz Lime Juice"]'),
  instructions: z
    .string()
    .describe('Complete step-by-step preparation instructions'),
  glassType: z
    .string()
    .optional()
    .describe('Serving glass, e.g. "Coupe", "Rocks", "Highball"'),
  difficulty: z
    .string()
    .optional()
    .describe('Difficulty level: "Easy", "Medium", or "Advanced"'),
  abv: z
    .string()
    .optional()
    .describe('Approximate ABV percentage as a string, e.g. "18%"'),
  imageEmoji: z
    .string()
    .optional()
    .describe('A single emoji that represents the drink, e.g. "🍸"'),
  youtubeUrl: z
    .string()
    .optional()
    .describe('YouTube tutorial URL if already known (e.g. from proposeAddToLibrary). Skip the YouTube search if this is provided.'),
});

// ─── Helper: search YouTube ──────────────────────────────────────────────────
export async function fetchYouTubeUrl(cocktailName: string): Promise<string | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  const queries = [
    `how to make ${cocktailName} cocktail recipe`,
    `${cocktailName} cocktail`,
  ];

  for (const q of queries) {
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=1&key=${key}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.warn(`[YouTube] ${res.status} for "${q}":`, body.slice(0, 200));
        continue;
      }
      const data = (await res.json()) as any;
      const videoId = data.items?.[0]?.id?.videoId;
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    } catch (err) {
      console.warn(`[YouTube] fetch error for "${q}":`, err);
    }
  }
  return null;
}

// ─── Helper: fetch cocktail image from TheCocktailDB ──────────────────────────
// Returns a real photo of the drink (not a YouTube thumbnail).
export async function fetchCocktailImage(cocktailName: string): Promise<string | null> {
  try {
    const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(cocktailName)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const thumb = data.drinks?.[0]?.strDrinkThumb as string | undefined;
    if (thumb) return thumb;
  } catch {
    // CocktailDB unavailable — fall through
  }
  return null;
}

// ─── Helper: infer bar equipment from instructions + ingredients ──────────────
// Scans the recipe text for mentions of bar tools and techniques.
const EQUIPMENT_RULES: Array<{ pattern: RegExp; tool: string; emoji: string }> = [
  { pattern: /\bshake\b|\bshaker\b|\bshaking\b|\bshaken\b/i,           tool: 'Cocktail Shaker',      emoji: '🫗' },
  { pattern: /\bdouble[- ]strain/i,                                      tool: 'Fine Mesh Strainer',   emoji: '🔘' },
  { pattern: /\bstrain\b|\bstrainer\b/i,                                tool: 'Hawthorne Strainer',   emoji: '🪤' },
  { pattern: /\bmuddle\b|\bmuddl/i,                                     tool: 'Muddler',              emoji: '🪵' },
  { pattern: /\bstir\b|\bstirr|\bbar\s*spoon/i,                         tool: 'Bar Spoon',            emoji: '🥄' },
  { pattern: /\bmixing glass/i,                                          tool: 'Mixing Glass',         emoji: '🫙' },
  { pattern: /\bjigger\b|\bmeasur/i,                                     tool: 'Jigger',               emoji: '📏' },
  { pattern: /\bblend\b|\bblender\b/i,                                  tool: 'Blender',              emoji: '🌀' },
  { pattern: /\bcitrus press|\bjuicer|\bsqueeze.*fresh/i,               tool: 'Citrus Juicer',        emoji: '🍋' },
  { pattern: /\bpeeler\b|\bpeel\b|\btwist\b|\bzest\b/i,                 tool: 'Vegetable Peeler',     emoji: '🔪' },
  { pattern: /\btorch|\bbrûlée|\bflambé/i,                              tool: 'Kitchen Torch',        emoji: '🔥' },
  { pattern: /\babsinthe rinse|\brinse.*glass/i,                        tool: 'Atomizer / Spray',     emoji: '💨' },
  { pattern: /\bice\b.*\bcube|\blarge\s*ice|\bclear\s*ice/i,            tool: 'Ice Mold',             emoji: '🧊' },
];

export function inferEquipment(instructions: string, ingredients: string[]): string[] {
  const combined = `${instructions} ${ingredients.join(' ')}`;
  const equipment: string[] = [];
  const seen = new Set<string>();

  for (const rule of EQUIPMENT_RULES) {
    if (rule.pattern.test(combined) && !seen.has(rule.tool)) {
      seen.add(rule.tool);
      equipment.push(`${rule.emoji} ${rule.tool}`);
    }
  }

  // If "stir" matched but we already have "Cocktail Shaker", instructions say
  // "stir" in context of giving it a final stir — still include bar spoon.
  // But if instructions mention "mixing glass" and "stir", it's a stirred drink,
  // so remove the shaker (shaker was a false positive from "shake" in ingredients maybe).

  return equipment;
}

// ─── proposeAddToLibrary ─────────────────────────────────────────────────────
// No database side effects. Returns data so the frontend can render a button.
// Also fetches a YouTube video so the embed appears immediately — no separate
// findYouTubeVideo step required.
export const proposeAddToLibrary = tool({
  description:
    'Signal to the user interface that a cocktail can be saved to the recipe library. ' +
    'Call this automatically after you suggest or describe any specific named cocktail. ' +
    'This causes an "Add to Library" button AND a YouTube video embed to appear in chat. ' +
    'Do NOT call addCocktailToLibrary at the same time — wait for the user to confirm.',
  inputSchema: recipeInputSchema,
  execute: async (recipeData) => {
    // Fetch YouTube video so the embed appears together with the add button.
    const youtubeUrl = await fetchYouTubeUrl(recipeData.name);
    let videoId: string | null = null;
    if (youtubeUrl) {
      const m = youtubeUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      videoId = m?.[1] ?? null;
    }

    // Fetch a real cocktail photo (TheCocktailDB), NOT a YouTube thumbnail
    const imageUrl = await fetchCocktailImage(recipeData.name);

    // Infer bar equipment needed
    const equipment = inferEquipment(recipeData.instructions, recipeData.ingredients);

    return {
      proposed: true,
      cocktailName: recipeData.name,
      recipeData: { ...recipeData, imageUrl, equipment },
      youtubeVideoId: videoId,
      youtubeUrl: youtubeUrl ?? null,
    };
  },
});

// ─── addCocktailToLibrary ────────────────────────────────────────────────────
// Actually writes the recipe to the DB. Searches YouTube automatically.
export const addCocktailToLibrary = tool({
  description:
    'Add a cocktail recipe to the Jigger.ai recipe library. ' +
    'The user must explicitly ask to save or add the drink before you call this. ' +
    'Fills in all recipe fields and automatically finds a YouTube tutorial video. ' +
    'Returns the new recipe ID and a YouTube URL (if found).',
  inputSchema: recipeInputSchema,
  execute: async (recipeData) => {
    // 1. Check for duplicate
    const existing = await db
      .select({ id: recipes.id, name: recipes.name })
      .from(recipes)
      .where(eq(recipes.name, recipeData.name))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        reason: 'duplicate',
        message: `"${recipeData.name}" already exists in the library (ID #${existing[0]!.id}).`,
        recipeId: existing[0]!.id,
      };
    }

    // 2. Search YouTube (skip if URL already known from proposeAddToLibrary)
    const youtubeUrl = recipeData.youtubeUrl ?? await fetchYouTubeUrl(recipeData.name);

    let youtubeVideoId: string | null = null;
    if (youtubeUrl) {
      const m = youtubeUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      youtubeVideoId = m?.[1] ?? null;
    }

    // 3. Fetch a real cocktail photo from TheCocktailDB (not YouTube thumbnail)
    const imageUrl = await fetchCocktailImage(recipeData.name);

    // 4. Infer bar equipment
    const equipment = inferEquipment(recipeData.instructions, recipeData.ingredients);

    // 5. Insert into DB
    const [inserted] = await db
      .insert(recipes)
      .values({
        name: recipeData.name,
        category: recipeData.category,
        baseSpirit: recipeData.baseSpirit,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        glassType: recipeData.glassType ?? null,
        difficulty: recipeData.difficulty ?? null,
        abv: recipeData.abv ?? null,
        imageEmoji: recipeData.imageEmoji ?? '🍸',
        youtubeUrl: youtubeUrl ?? null,
        imageUrl: imageUrl ?? null,
        equipment,
      })
      .returning({ id: recipes.id });

    return {
      success: true,
      recipeId: inserted!.id,
      name: recipeData.name,
      youtubeVideoId: youtubeVideoId ?? null,
      message: `"${recipeData.name}" has been added to your cocktail library! 🥂${youtubeUrl ? ' Video tutorial attached.' : ''}`,
    };
  },
});
