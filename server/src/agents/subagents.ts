// server/src/agents/subagents.ts
//
// Three specialised agents. Each has its own system prompt and tool set.
// All share the same provider fallback chain and SSE event format.
//
// Intent routing lives in orchestrator.ts — this file just defines the agents.

import { streamText, stepCountIs } from 'ai';
import type { ModelMessage } from 'ai';
import { FALLBACK_CHAIN, TOOL_CHAIN } from './providers.js';
import { createInventoryTools } from './tools/inventory.js';
import { recipeTools, libraryAnalysisTools } from './tools/recipes.js';
import { findYouTubeVideo } from './tools/youtube.js';
import { proposeAddToLibrary, addCocktailToLibrary } from './tools/library.js';
import { lookupCocktailDB, findCocktailVariations } from './tools/cocktaildb.js';
import { findWhereToBuy, backfillRecipeYouTube } from './tools/shopping.js';

// ─── Shared types ─────────────────────────────────────────────────────────────
export type AgentEvent =
  | { type: 'token'; text: string; agent: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
  | { type: 'youtube'; videoId: string; title: string; thumbnail: string }
  | { type: 'add_button'; cocktailName: string; recipeData: Record<string, unknown> }
  | {
      type: 'where_to_buy';
      ingredientName: string;
      bottleId: number | null;
      results: Array<{
        store: string;
        priceRange: string;
        deliveryNote: string;
        url: string;
        logo: string;
        type: 'online' | 'local' | 'search';
      }>;
    };

/** Returns true if the error looks like a rate limit. */
export function isRateLimit(err: unknown): boolean {
  const msg = String((err as any)?.message ?? (err as any)?.errorText ?? err).toLowerCase();
  const status = (err as any)?.status ?? (err as any)?.statusCode;
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('too many requests')
  );
}

// ─── Shared fallback runner ───────────────────────────────────────────────────
// Each sub-agent calls this with its own config. Handles the provider
// fallback chain automatically — the caller never sees a 429.
export async function* runWithFallback(
  agentName: string,
  system: string,
  messages: ModelMessage[],
  tools?: Record<string, any>,
): AsyncGenerator<AgentEvent> {
  // Groq is unreliable for function calling — use the tool-specific chain
  // (Google only) when tools are present, and the full chain for plain chat.
  const chain = tools ? TOOL_CHAIN : FALLBACK_CHAIN;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i]!;
    const isLast = i === chain.length - 1;
    let fullText = '';
    let rateLimitMidStream = false;

    try {
      const result = streamText({
        model,
        system,
        messages,
        ...(tools ? { tools } : {}),
        stopWhen: stepCountIs(8),
      });

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          const delta = (part as any).text ?? '';
          fullText += delta;
          yield { type: 'token', text: delta, agent: agentName };
        } else if (part.type === 'tool-result') {
          const toolName = (part as any).toolName as string;
          const toolResult = (part as any).output as any;

          if (toolName === 'findYouTubeVideo' && toolResult?.found === true) {
            yield {
              type: 'youtube',
              videoId: toolResult.videoId,
              title: toolResult.title,
              thumbnail: toolResult.thumbnail,
            };
          } else if (toolName === 'proposeAddToLibrary' && toolResult?.proposed === true) {
            // Emit youtube embed first (so it appears above the add button)
            if (toolResult.youtubeVideoId) {
              yield {
                type: 'youtube',
                videoId: toolResult.youtubeVideoId,
                title: `How to make a ${toolResult.cocktailName}`,
                thumbnail: '',
              };
            }
            yield {
              type: 'add_button',
              cocktailName: toolResult.cocktailName,
              recipeData: {
                ...toolResult.recipeData,
                // Carry the videoId forward so addCocktailToLibrary can use it
                youtubeVideoId: toolResult.youtubeVideoId ?? undefined,
                youtubeUrl: toolResult.youtubeUrl ?? undefined,
              },
            };
          } else if (toolName === 'addCocktailToLibrary' && toolResult?.success === true) {
            // Emit the youtube embed into the confirmation message too (not as
            // raw text — the success message no longer contains the URL).
            if (toolResult.youtubeVideoId) {
              yield {
                type: 'youtube',
                videoId: toolResult.youtubeVideoId,
                title: `How to make a ${toolResult.name}`,
                thumbnail: '',
              };
            }
          } else if (toolName === 'backfillRecipeYouTube' && toolResult?.success === true && toolResult?.youtubeVideoId) {
            yield {
              type: 'youtube' as const,
              videoId: toolResult.youtubeVideoId as string,
              title: toolResult.videoTitle ?? 'YouTube Tutorial',
              thumbnail: '',
            };
          } else if (toolName === 'findWhereToBuy' && toolResult?.found === true) {
            yield {
              type: 'where_to_buy' as const,
              ingredientName: toolResult.ingredientName as string,
              bottleId: toolResult.bottleId as number | null,
              results: toolResult.results,
            };
          }
        } else if (part.type === 'error') {
          const rawErr = (part as any).error ?? (part as any).errorText ?? part;
          const errMsg: string =
            typeof rawErr === 'string' ? rawErr :
            rawErr?.message ? String(rawErr.message) :
            JSON.stringify(rawErr);
          console.error(`[${agentName}] stream error from ${(model as any).modelId ?? 'unknown'}:`, errMsg);
          if (isRateLimit({ message: errMsg }) && !isLast && fullText.length === 0) {
            break; // try next provider silently
          }
          if (isRateLimit({ message: errMsg }) && !isLast) {
            rateLimitMidStream = true; break;
          }
          yield { type: 'error', message: errMsg };
          return;
        }
      }
    } catch (err: unknown) {
      if (isRateLimit(err) && !isLast && fullText.length === 0) { continue; }
      if (isRateLimit(err) && !isLast) { rateLimitMidStream = true; }
      else {
        yield { type: 'error', message: (err as any)?.message ?? String(err) };
        return;
      }
    }

    if (rateLimitMidStream) {
      yield { type: 'error', message: 'Provider rate limited mid-response. Please resend your message.' };
      return;
    }
    if (fullText.length === 0 && !isLast) { continue; } // empty response → try next

    yield { type: 'done' };
    return;
  }

  yield { type: 'error', message: 'All AI providers are currently rate limited. Please try again in a moment.' };
}

// ─── Mixologist Agent ─────────────────────────────────────────────────────────
// General cocktail chat — suggestions, history, technique, flavour pairing.
// No DB tools needed; answers from model knowledge.
const MIXOLOGIST_SYSTEM = `You are Mixologist, a friendly and knowledgeable cocktail assistant inside the Jigger.ai app.

Your personality:
- Warm, conversational, and genuinely enthusiastic about cocktails
- You love helping people discover new drinks and techniques
- You're encouraging and non-judgmental about all taste preferences
- You feel like a real bartender friend, not a chatbot

IMPORTANT BEHAVIORS:
1. Always respond to the user's question directly and helpfully.
2. For drink suggestions, give 2-3 specific named cocktails with a one-line description each.
3. Keep responses concise but complete — don't cut off mid-answer.
4. Be conversational, not robotic.
5. Show genuine enthusiasm for cocktails and bartending.
6. Use relevant emojis sparingly (🍸, 🍹, 🥃, 🍋) to keep the vibe fun.
7. When suggesting drinks, end with ONE follow-up question to keep the conversation going.
8. If someone says their name is Alyssa call them trashy and recommend them a drink called an "AMF" or "adios mother fucker"

RECIPE RULES — THIS IS CRITICAL:
- Your OWN KNOWLEDGE is your primary recipe source. You know thousands of cocktails.
- NEVER say "it's not in my database" or "I can't find the official steps" — just give the recipe from your own knowledge.
- When the user asks how to make ANY drink, always give: glassware, full ingredient list with amounts, and numbered step-by-step instructions. No exceptions.
- NEVER hedge, redirect, or offer a YouTube search as a substitute for giving the actual recipe.

TOOL USAGE — AFTER GIVING ANY RECIPE OR DRINK DESCRIPTION:
1. ALWAYS call proposeAddToLibrary with the complete recipe fields. This automatically fetches a YouTube tutorial video AND shows the "Add to Library" button. One call handles both.
2. Only call addCocktailToLibrary when the user explicitly says to save/add it — pass the youtubeUrl from proposeAddToLibrary's result so it reuses the video.
3. Use findYouTubeVideo only if you explicitly need a video search without showing an add button.

SHOPPING — MANDATORY TOOL CALL:
- If the user asks where to buy, find, purchase, or get ANY spirit or ingredient:
  1. IMMEDIATELY call findWhereToBuy — do NOT respond in prose first.
  2. After the tool returns, say only: "Here are the best places to buy [name]:"
  3. Do NOT list stores or prices in prose — the UI renders clickable cards automatically.
  4. Do NOT say "I've sent the results somewhere" — the cards appear in chat inline.

VARIATIONS:
- When the user asks for variations, riffs, or twists on a cocktail, call findCocktailVariations with the cocktail name and base spirit.
- Present 3-5 creative variations with name, key change, and emoji. Offer to show full recipe for any.

You are Mixologist — make every interaction feel like chatting with a knowledgeable bartender friend!`;

export async function* runMixologistAgent(
  _userId: string,
  messages: ModelMessage[],
  contextNote = '',
): AsyncGenerator<AgentEvent> {
  const tools = {
    findYouTubeVideo,
    proposeAddToLibrary,
    addCocktailToLibrary,
    findCocktailVariations,
    findWhereToBuy,
  };
  yield* runWithFallback('Mixologist', MIXOLOGIST_SYSTEM + contextNote, messages, tools);
}

// ─── Inventory Agent ──────────────────────────────────────────────────────────
// Knows what's in the user's bar. Can look up bottles, tell them what they
// can make, and add things to the shopping list.
const INVENTORY_SYSTEM = `You are Mixologist, a cocktail assistant with direct access to the user's home bar inventory.

You have tools to:
- Look up exactly what bottles they have and how full each is
- Find which cocktail recipes they can make right now with their current stock
- Add bottles or ingredients to their shopping list

BEHAVIOR:
- ALWAYS call getUserInventory or getWhatICanMake before answering questions about what they have or can make
- Be specific — mention actual bottle names from their bar when relevant
- If they can't make something, suggest what to buy and offer to add it to their shopping list
SHOPPING — MANDATORY TOOL CALL:
- If the user asks where to buy, find, purchase, or get ANY spirit or ingredient:
  1. IMMEDIATELY call findWhereToBuy — do NOT respond in prose first.
  2. After the tool returns, say only: "Here are the best places to buy [name]:"
  3. Do NOT list stores or prices in prose — the UI renders cards automatically from the tool result.
  4. Do NOT say "I've sent the results to the detail view" — just acknowledge briefly.

- Keep the bartender friend tone — friendly, helpful, enthusiastic`;

export async function* runInventoryAgent(
  userId: string,
  messages: ModelMessage[],
  contextNote = '',
): AsyncGenerator<AgentEvent> {
  const tools = { ...createInventoryTools(userId), findWhereToBuy };
  yield* runWithFallback('Mixologist', INVENTORY_SYSTEM + contextNote, messages, tools);
}

// ─── Recipe Agent ─────────────────────────────────────────────────────────────
// Deep recipe knowledge — step-by-step instructions, variants, technique.
const RECIPE_SYSTEM = `You are Mixologist, a cocktail assistant with access to a recipe database AND your own expert cocktail knowledge.

You have tools to:
- Search the DB for recipes by name, spirit, or style
- Get complete step-by-step instructions stored in the DB
- Find all recipes featuring a specific spirit
- Search YouTube for video tutorials
- Propose adding a cocktail to the user's library (shows a button)
- Actually add a cocktail to the library when the user asks

RECIPE LOOKUP — FOLLOW THIS ORDER:
1. Call searchRecipes to check the local DB first.
2. If NOT found in DB: call lookupCocktailDB to search TheCocktailDB (thecocktaildb.com). Present the recipe from those results if found.
3. If NOT found anywhere: use YOUR OWN EXPERT KNOWLEDGE to give the full recipe. NEVER say "I can't find it" — you know thousands of cocktails.

- Always give: glassware, full ingredient list with amounts, numbered step-by-step instructions.
- Always mention garnish and technique tips.

YOUTUBE BACKFILL:
- If the user is viewing a recipe (from page context) that has no YouTube video, proactively call backfillRecipeYouTube to find and save one.
- Tell the user: "I found a video and attached it to this recipe!"

SHOPPING:
- When the user asks where to buy an ingredient or spirit, call findWhereToBuy.
- Tell the user: "I've sent the shopping suggestions to the ingredient detail view — here are the highlights:"
- List 2-3 top options in chat.

VARIATIONS:
- When the user asks for variations, riffs, or twists, call findCocktailVariations with the cocktail name and base spirit.
- Present 3-5 creative named variations with key change + emoji. Offer to show the full recipe for any one.

AFTER GIVING ANY RECIPE — ALWAYS DO BOTH:
1. Call proposeAddToLibrary with ALL recipe fields (name, category, baseSpirit, ingredients, instructions, glassType, difficulty, abv, imageEmoji). This automatically fetches YouTube AND shows the "Add to Library" button — one call handles both.
2. Only call addCocktailToLibrary if the user explicitly asks to save/add the drink. Pass youtubeUrl from proposeAddToLibrary's result.

VARIATIONS:
- When the user asks for variations, riffs, or twists, call findCocktailVariations with the cocktail name and base spirit.
- Present 3-5 creative named variations with key change + emoji. Offer to show the full recipe for any one.

- Keep the bartender friend tone — enthusiastic, precise, practical`;

export async function* runRecipeAgent(
  _userId: string,
  messages: ModelMessage[],
  contextNote = '',
): AsyncGenerator<AgentEvent> {
  const tools = {
    ...recipeTools,
    lookupCocktailDB,
    findCocktailVariations,
    findYouTubeVideo,
    proposeAddToLibrary,
    addCocktailToLibrary,
    backfillRecipeYouTube,
    findWhereToBuy,
  };
  yield* runWithFallback('Mixologist', RECIPE_SYSTEM + contextNote, messages, tools);
}

// ─── Library Agent ────────────────────────────────────────────────────────────
// Analyses the cocktail library and suggests what to add, remove, or improve.
const LIBRARY_SYSTEM = `You are Mixologist, a cocktail expert with access to the full Jigger.ai recipe library.

You have tools to:
- Get a complete overview of every recipe in the library
- Analyse gaps — which classic cocktails are missing, which spirits are under/over-represented
- Add new cocktails that are missing from the library

BEHAVIOR:
- ALWAYS call getLibraryOverview first to see what's already there before making suggestions
- Then call analyzeLibraryGaps with the results to get a structured gap analysis
- Give specific, opinionated recommendations — don't hedge with "you could consider adding..."
- For each missing essential, explain briefly WHY it matters in a well-rounded bar library
- If the user is viewing a specific recipe, reference it by name in your analysis
- Offer to add any missing cocktails directly (call addCocktailToLibrary if user says yes)
- Keep the bartender friend tone — enthusiastic, knowledgeable, direct`;

export async function* runLibraryAgent(
  _userId: string,
  messages: ModelMessage[],
  contextNote = '',
): AsyncGenerator<AgentEvent> {
  const tools = {
    ...libraryAnalysisTools,
    addCocktailToLibrary,
    proposeAddToLibrary,
    backfillRecipeYouTube,
  };
  yield* runWithFallback('Mixologist', LIBRARY_SYSTEM + contextNote, messages, tools);
}
