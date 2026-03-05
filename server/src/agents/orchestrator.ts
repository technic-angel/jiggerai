// server/src/agents/orchestrator.ts
//
// Entry point for all chat. Classifies intent → routes to the right agent →
// streams SSE events back to app.ts → saves turn to session history.

import type { ModelMessage } from 'ai';
import { getHistory, appendHistory } from './memory.js';
import { runMixologistAgent, runInventoryAgent, runRecipeAgent, runLibraryAgent } from './subagents.js';

// ─── Page context (mirrors the client's PageContext type) ─────────────────────
export interface PageContext {
  type: string | null;
  id: number | null;
  name: string | null;
  summary: string | null;
}

// ─── Intent classifier ────────────────────────────────────────────────────────
export type Intent = 'inventory' | 'recipe' | 'library' | 'mixologist';

export function classifyIntent(message: string, ctx?: PageContext): Intent {
  const m = message.toLowerCase();

  // Inventory + shopping intent — questions about the user's specific bar or buying spirits
  if (
    /\b(my bar|my inventory|my bottles?|my stock|what (do i|i) have|what('s| is) in|can i make|what can i make|i have|i('ve| have) got|shopping list|add.*to.*list|where (can i|to) buy|where (do|can) (i|you) (find|get|buy|purchase)|buy online|order online|how much (is|does)|price of|find.*near(by| me)|local.*store|liquor store|online order|ship to|delivers?|purchase|retail|retailer)\b/.test(m) ||
    ctx?.type === 'spirit'
  ) {
    return 'inventory';
  }

  // Library analysis intent — opinions on the recipe collection itself
  if (/\b(library|collection|what('s| is) (missing|in (my|the))|what should i add|what to add|gaps?|recommend.*add|remove.*recipe|delete.*recipe|too many|not enough|what (cocktails?|recipes?) (should|do) (i|we)|analyze|curate|improve.*library|library.*review)\b/.test(m)) {
    return 'library';
  }

  // Recipe intent — how-to questions, variations, or user is looking at a recipe right now
  if (
    /\b(how (do i|to) make|recipe (for|of)|how (is|are|do you make)|step[s ]|ingredient[s ]|what('s| is) in a|make a|make me a|instructions|method|technique|garnish|show me how|walk me through|what goes in|what do i need to make|how do you mix|how is it made|variation[s ]?|riff[s ]?|twist[s ]? on|version of|alternative to|riff on|cocktail riff|modify|modification)\b/.test(m) ||
    ctx?.type === 'recipe'
  ) {
    return 'recipe';
  }

  return 'mixologist';
}

// ─── Format page context into a system note ───────────────────────────────────
export function formatContextNote(ctx?: PageContext): string {
  if (!ctx || !ctx.type) return '';

  const parts: string[] = [];

  if (ctx.type === 'recipe' && ctx.name) {
    parts.push(`The user is currently viewing the recipe: "${ctx.name}" (recipe ID: ${ctx.id ?? 'unknown'}).`);
    parts.push('They may ask about this recipe specifically. Reference it naturally in your response.');
    const noVideo = ctx.summary?.includes('hasYoutubeUrl: false');
    if (noVideo) {
      parts.push(`This recipe has NO YouTube video yet. Proactively call backfillRecipeYouTube(recipeId=${ctx.id ?? 0}, recipeName="${ctx.name}") to find and attach one.`);
    }
  } else if (ctx.type === 'spirit' && ctx.name) {
    parts.push(`The user is currently viewing the bottle: "${ctx.name}" (bottle ID: ${ctx.id ?? 'unknown'}) in their inventory.`);
    parts.push(`If the user asks where to buy it, call findWhereToBuy with ingredientName="${ctx.name}" and bottleId=${ctx.id ?? 'null'}.`);
    parts.push('They may also ask about cocktails or uses for this spirit.');
  } else if (ctx.type === 'recipes') {
    parts.push('The user is currently browsing the recipe library.');
  } else if (ctx.type === 'home') {
    parts.push('The user is on the home screen.');
  }

  if (ctx.summary) {
    parts.push(`Additional context: ${ctx.summary}`);
  }

  return parts.length > 0 ? `\n\n[CURRENT SCREEN CONTEXT]\n${parts.join(' ')}\n` : '';
}

// ─── Main entry point (called by app.ts) ─────────────────────────────────────
export async function* runAgent(
  userId: string,
  sessionId: string,
  message: string,
  pageContext?: PageContext,
) {
  const history = getHistory(sessionId);
  const messages: ModelMessage[] = [...history, { role: 'user', content: message }];
  const contextNote = formatContextNote(pageContext);
  const intent = classifyIntent(message, pageContext ?? undefined);

  const agentFn = {
    inventory:  () => runInventoryAgent(userId, messages, contextNote),
    recipe:     () => runRecipeAgent(userId, messages, contextNote),
    library:    () => runLibraryAgent(userId, messages, contextNote),
    mixologist: () => runMixologistAgent(userId, messages, contextNote),
  }[intent];

  let fullText = '';
  for await (const event of agentFn()) {
    if (event.type === 'token') fullText += event.text ?? '';
    yield event;
  }

  if (fullText) {
    appendHistory(
      sessionId,
      { role: 'user',      content: message  },
      { role: 'assistant', content: fullText },
    );
  }
}
