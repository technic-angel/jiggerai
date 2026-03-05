/**
 * Tests for agents/subagents.ts — isRateLimit, runWithFallback, and agent generators.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock providers ───────────────────────────────────────────────────────────
vi.mock('../agents/providers.js', () => ({
  FALLBACK_CHAIN: [{ modelId: 'model-a' }, { modelId: 'model-b' }],
  TOOL_CHAIN: [{ modelId: 'tool-model-a' }, { modelId: 'tool-model-b' }],
}));

// ── Mock all tool imports (prevent real module loading) ───────────────────────
vi.mock('../agents/tools/inventory.js', () => ({
  createInventoryTools: vi.fn(() => ({ getUserInventory: {} })),
}));
vi.mock('../agents/tools/recipes.js', () => ({
  recipeTools: { searchRecipes: {} },
  libraryAnalysisTools: { getLibraryOverview: {} },
}));
vi.mock('../agents/tools/youtube.js', () => ({
  findYouTubeVideo: {},
}));
vi.mock('../agents/tools/library.js', () => ({
  proposeAddToLibrary: {},
  addCocktailToLibrary: {},
}));
vi.mock('../agents/tools/cocktaildb.js', () => ({
  lookupCocktailDB: {},
  findCocktailVariations: {},
}));
vi.mock('../agents/tools/shopping.js', () => ({
  findWhereToBuy: {},
  backfillRecipeYouTube: {},
}));

// ── Mock AI SDK ───────────────────────────────────────────────────────────────
const mockStreamText = vi.fn();
vi.mock('ai', () => ({
  streamText: (...args: any[]) => mockStreamText(...args),
  stepCountIs: vi.fn(() => 8),
}));

import { isRateLimit, runWithFallback, AgentEvent } from '../agents/subagents.js';
import {
  runMixologistAgent,
  runInventoryAgent,
  runRecipeAgent,
  runLibraryAgent,
} from '../agents/subagents.js';

// Helper: collect all events from an async generator
async function collect(gen: AsyncGenerator<AgentEvent>): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const e of gen) events.push(e);
  return events;
}

// Helper: create a mock fullStream
function makeStream(parts: Array<Record<string, any>>) {
  return {
    fullStream: (async function* () {
      for (const p of parts) yield p;
    })(),
  };
}

describe('subagents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── isRateLimit ─────────────────────────────────────────────────────────────
  describe('isRateLimit', () => {
    it('returns true for status 429', () => {
      expect(isRateLimit({ status: 429 })).toBe(true);
    });

    it('returns true for statusCode 429', () => {
      expect(isRateLimit({ statusCode: 429 })).toBe(true);
    });

    it('returns true for message containing "rate limit"', () => {
      expect(isRateLimit({ message: 'You hit a rate limit' })).toBe(true);
    });

    it('returns true for message containing "rate_limit"', () => {
      expect(isRateLimit({ message: 'rate_limit_exceeded' })).toBe(true);
    });

    it('returns true for message containing "429"', () => {
      expect(isRateLimit({ message: 'Error 429 returned' })).toBe(true);
    });

    it('returns true for message containing "quota"', () => {
      expect(isRateLimit({ message: 'quota exceeded' })).toBe(true);
    });

    it('returns true for message containing "resource_exhausted"', () => {
      expect(isRateLimit({ message: 'resource_exhausted' })).toBe(true);
    });

    it('returns true for message containing "too many requests"', () => {
      expect(isRateLimit({ message: 'too many requests' })).toBe(true);
    });

    it('returns false for a generic error', () => {
      expect(isRateLimit({ message: 'Something went wrong' })).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isRateLimit(null)).toBe(false);
      expect(isRateLimit(undefined)).toBe(false);
    });

    it('handles plain string error', () => {
      expect(isRateLimit('rate limit reached')).toBe(true);
    });

    it('handles errorText property', () => {
      expect(isRateLimit({ errorText: 'Too many requests' })).toBe(true);
    });
  });

  // ── runWithFallback ─────────────────────────────────────────────────────────
  describe('runWithFallback', () => {
    const msgs = [{ role: 'user' as const, content: 'hello' }];

    it('streams tokens and yields done on success', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'Hello' },
        { type: 'text-delta', text: ' World' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toEqual([
        { type: 'token', text: 'Hello', agent: 'Test' },
        { type: 'token', text: ' World', agent: 'Test' },
        { type: 'done' },
      ]);
    });

    it('falls back to next provider on rate limit (thrown, no text yet)', async () => {
      mockStreamText
        .mockImplementationOnce(() => { throw { status: 429, message: 'rate limit' }; })
        .mockReturnValueOnce(makeStream([
          { type: 'text-delta', text: 'ok' },
        ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toEqual([
        { type: 'token', text: 'ok', agent: 'Test' },
        { type: 'done' },
      ]);
      expect(mockStreamText).toHaveBeenCalledTimes(2);
    });

    it('yields error when rate limit mid-stream (some text already emitted)', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'partial' },
        { type: 'error', error: { message: 'rate limit' } },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      const last = events[events.length - 1];
      expect(last).toEqual({ type: 'error', message: 'Provider rate limited mid-response. Please resend your message.' });
    });

    it('yields error for non-rate-limit stream errors', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'error', error: 'Something broke' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toEqual([
        { type: 'error', message: 'Something broke' },
      ]);
    });

    it('yields error for non-rate-limit thrown errors', async () => {
      mockStreamText.mockImplementation(() => { throw new Error('Network failed'); });

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toEqual([
        { type: 'error', message: 'Network failed' },
      ]);
    });

    it('yields error for last provider when all throw rate-limit errors', async () => {
      mockStreamText
        .mockImplementationOnce(() => { throw { status: 429, message: 'rate limited' }; })
        .mockImplementationOnce(() => { throw { status: 429, message: 'rate limited' }; });

      const events = await collect(runWithFallback('Test', 'system', msgs));
      // Last provider catches rate-limit but isLast=true → falls to else branch
      expect(events).toEqual([
        { type: 'error', message: 'rate limited' },
      ]);
    });

    it('falls back when first provider returns empty', async () => {
      mockStreamText
        .mockReturnValueOnce(makeStream([]))  // empty
        .mockReturnValueOnce(makeStream([
          { type: 'text-delta', text: 'fallback' },
        ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toEqual([
        { type: 'token', text: 'fallback', agent: 'Test' },
        { type: 'done' },
      ]);
    });

    it('uses TOOL_CHAIN when tools are provided', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'tool' },
      ]));

      await collect(runWithFallback('Test', 'system', msgs, { someTool: {} }));
      const call = mockStreamText.mock.calls[0][0];
      expect(call.model).toEqual({ modelId: 'tool-model-a' });
    });

    it('uses FALLBACK_CHAIN when no tools provided', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'chat' },
      ]));

      await collect(runWithFallback('Test', 'system', msgs));
      const call = mockStreamText.mock.calls[0][0];
      expect(call.model).toEqual({ modelId: 'model-a' });
    });

    // ── tool-result events ──────────────────────────────────────────────────
    it('yields youtube event for findYouTubeVideo tool result', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'findYouTubeVideo',
          output: { found: true, videoId: 'abc', title: 'Test', thumbnail: 'thumb.jpg' },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events).toContainEqual({
        type: 'youtube',
        videoId: 'abc',
        title: 'Test',
        thumbnail: 'thumb.jpg',
      });
    });

    it('yields add_button event for proposeAddToLibrary with youtube', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'proposeAddToLibrary',
          output: {
            proposed: true,
            cocktailName: 'Mojito',
            recipeData: { name: 'Mojito' },
            youtubeVideoId: 'xyz',
            youtubeUrl: 'https://youtube.com/watch?v=xyz',
          },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube' && e.videoId === 'xyz')).toBe(true);
      expect(events.some((e: any) => e.type === 'add_button' && e.cocktailName === 'Mojito')).toBe(true);
    });

    it('yields add_button without youtube when no videoId', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'proposeAddToLibrary',
          output: {
            proposed: true,
            cocktailName: 'Custom Drink',
            recipeData: { name: 'Custom Drink' },
          },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube')).toBe(false);
      expect(events.some((e: any) => e.type === 'add_button')).toBe(true);
    });

    it('yields youtube for addCocktailToLibrary success with videoId', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'addCocktailToLibrary',
          output: { success: true, youtubeVideoId: 'vid1', name: 'Negroni' },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube' && e.videoId === 'vid1')).toBe(true);
    });

    it('does not yield youtube for addCocktailToLibrary without videoId', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'addCocktailToLibrary',
          output: { success: true, name: 'Negroni' },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube')).toBe(false);
    });

    it('yields youtube event for backfillRecipeYouTube success', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'backfillRecipeYouTube',
          output: { success: true, youtubeVideoId: 'bf1', videoTitle: 'How to...' },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube' && e.videoId === 'bf1')).toBe(true);
    });

    it('does not yield youtube for backfillRecipeYouTube without videoId', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'backfillRecipeYouTube',
          output: { success: true },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube')).toBe(false);
    });

    it('yields where_to_buy event for findWhereToBuy', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'findWhereToBuy',
          output: {
            found: true,
            ingredientName: 'Campari',
            bottleId: 5,
            results: [{ store: 'Drizly', priceRange: '$', deliveryNote: 'Fast', url: 'https://...', logo: '🚚', type: 'online' }],
          },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'where_to_buy' && e.ingredientName === 'Campari')).toBe(true);
    });

    it('handles error part with string rawErr', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'error', error: 'raw error string' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toContainEqual({ type: 'error', message: 'raw error string' });
    });

    it('handles error part with non-string, non-message rawErr', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'error', error: { code: 500 } },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events[0]).toHaveProperty('type', 'error');
    });

    it('handles rate limit in stream error with no text on non-last provider', async () => {
      // First provider: rate limit error in the stream, no text emitted
      mockStreamText
        .mockReturnValueOnce(makeStream([
          { type: 'error', error: { message: '429 rate limit' } },
        ]))
        .mockReturnValueOnce(makeStream([
          { type: 'text-delta', text: 'recovered' },
        ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toContainEqual({ type: 'token', text: 'recovered', agent: 'Test' });
    });

    it('handles rate limit thrown mid-stream (some text) on non-last provider', async () => {
      // Return partial text then throw rate limit from the catch block
      let callCount = 0;
      mockStreamText.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            fullStream: (async function* () {
              yield { type: 'text-delta', text: 'partial' };
              throw { status: 429, message: 'rate_limit' };
            })(),
          };
        }
        return makeStream([{ type: 'text-delta', text: 'ok' }]);
      });

      const events = await collect(runWithFallback('Test', 'system', msgs));
      // Should get the partial token then the mid-stream error
      expect(events[0]).toEqual({ type: 'token', text: 'partial', agent: 'Test' });
      expect(events[events.length - 1]).toEqual({
        type: 'error',
        message: 'Provider rate limited mid-response. Please resend your message.',
      });
    });

    it('does not emit events for tool results that do not match known patterns', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'tool-result', toolName: 'unknownTool', output: { data: 'test' } },
        { type: 'text-delta', text: 'end' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.filter((e: any) => e.type === 'token')).toHaveLength(1);
      expect(events.some((e: any) => e.type === 'done')).toBe(true);
    });

    it('handles findYouTubeVideo not found (found: false)', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'tool-result', toolName: 'findYouTubeVideo', output: { found: false } },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube')).toBe(false);
    });

    it('handles proposeAddToLibrary not proposed', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'tool-result', toolName: 'proposeAddToLibrary', output: { proposed: false } },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'add_button')).toBe(false);
    });

    it('handles addCocktailToLibrary failure', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'tool-result', toolName: 'addCocktailToLibrary', output: { success: false } },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube')).toBe(false);
    });

    it('handles backfillRecipeYouTube failure', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'tool-result', toolName: 'backfillRecipeYouTube', output: { success: false } },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'youtube')).toBe(false);
    });

    it('handles findWhereToBuy not found', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'tool-result', toolName: 'findWhereToBuy', output: { found: false } },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      expect(events.some((e: any) => e.type === 'where_to_buy')).toBe(false);
    });

    it('handles error part using errorText property', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'error', errorText: 'error text message' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events).toContainEqual({ type: 'error', message: 'error text message' });
    });

    it('handles non-rate-limit thrown error with no message', async () => {
      mockStreamText.mockImplementation(() => { throw 'bare string error'; });
      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events[0]).toHaveProperty('type', 'error');
    });

    it('handles text-delta with undefined text (coalesces to empty)', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: undefined },
        { type: 'text-delta', text: 'actual' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      const tokens = events.filter((e: any) => e.type === 'token');
      expect(tokens[0].text).toBe('');
      expect(tokens[1].text).toBe('actual');
    });

    it('yields "YouTube Tutorial" default title for backfill without videoTitle', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        {
          type: 'tool-result',
          toolName: 'backfillRecipeYouTube',
          output: { success: true, youtubeVideoId: 'abc12345678' },
        },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs, {}));
      const yt = events.find((e: any) => e.type === 'youtube');
      expect(yt).toEqual(expect.objectContaining({ title: 'YouTube Tutorial' }));
    });

    it('handles error part with no error/errorText properties (fallback to part)', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'error' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events[0]).toHaveProperty('type', 'error');
    });

    it('logs "unknown" modelId when model has no modelId property', async () => {
      // Temporarily replace FALLBACK_CHAIN with a model without modelId
      const providers = await import('../agents/providers.js') as any;
      const original = [...providers.FALLBACK_CHAIN];
      providers.FALLBACK_CHAIN.length = 0;
      providers.FALLBACK_CHAIN.push({});

      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'error', error: 'some non-rate-limit error' },
      ]));

      const events = await collect(runWithFallback('Test', 'system', msgs));
      expect(events[0]).toHaveProperty('type', 'error');

      // Restore
      providers.FALLBACK_CHAIN.length = 0;
      providers.FALLBACK_CHAIN.push(...original);
    });
  });

  // ── Agent generators ────────────────────────────────────────────────────────
  describe('runMixologistAgent', () => {
    it('yields events from runWithFallback', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'Cheers!' },
      ]));
      const events = await collect(runMixologistAgent('user-1', [{ role: 'user', content: 'hi' }]));
      expect(events.some((e: any) => e.type === 'token')).toBe(true);
    });

    it('passes context note to system prompt', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([]));
      await collect(runMixologistAgent('user-1', [], 'ctx-note'));
      const call = mockStreamText.mock.calls[0][0];
      expect(call.system).toContain('ctx-note');
    });
  });

  describe('runInventoryAgent', () => {
    it('yields events from runWithFallback', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'Your bar...' },
      ]));
      const events = await collect(runInventoryAgent('user-1', [{ role: 'user', content: 'what do i have' }]));
      expect(events.some((e: any) => e.type === 'token')).toBe(true);
    });
  });

  describe('runRecipeAgent', () => {
    it('yields events from runWithFallback', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'Recipe:' },
      ]));
      const events = await collect(runRecipeAgent('user-1', [{ role: 'user', content: 'mojito recipe' }]));
      expect(events.some((e: any) => e.type === 'token')).toBe(true);
    });
  });

  describe('runLibraryAgent', () => {
    it('yields events from runWithFallback', async () => {
      mockStreamText.mockReturnValueOnce(makeStream([
        { type: 'text-delta', text: 'Library:' },
      ]));
      const events = await collect(runLibraryAgent('user-1', [{ role: 'user', content: 'analyze' }]));
      expect(events.some((e: any) => e.type === 'token')).toBe(true);
    });
  });

  describe('runWithFallback – all providers exhausted', () => {
    it('yields "All AI providers" error when chain is empty', async () => {
      // Temporarily empty the FALLBACK_CHAIN
      const providers = await import('../agents/providers.js') as any;
      const original = [...providers.FALLBACK_CHAIN];
      providers.FALLBACK_CHAIN.length = 0;

      const events = await collect(runWithFallback('Test', 'system', [{ role: 'user', content: 'hi' }]));
      expect(events).toEqual([
        { type: 'error', message: 'All AI providers are currently rate limited. Please try again in a moment.' },
      ]);

      // Restore
      providers.FALLBACK_CHAIN.push(...original);
    });
  });
});
