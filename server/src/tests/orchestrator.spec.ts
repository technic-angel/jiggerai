/**
 * Tests for agents/orchestrator.ts — intent classification, context notes, and agent routing.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { PageContext } from '../agents/orchestrator.js';

// Mock subagents
vi.mock('../agents/subagents.js', () => ({
  runMixologistAgent: vi.fn(function* () { yield { type: 'token', text: 'mix-response', agent: 'Mixologist' }; yield { type: 'done' }; }),
  runInventoryAgent:  vi.fn(function* () { yield { type: 'token', text: 'inv-response', agent: 'Mixologist' }; yield { type: 'done' }; }),
  runRecipeAgent:     vi.fn(function* () { yield { type: 'token', text: 'rec-response', agent: 'Mixologist' }; yield { type: 'done' }; }),
  runLibraryAgent:    vi.fn(function* () { yield { type: 'token', text: 'lib-response', agent: 'Mixologist' }; yield { type: 'done' }; }),
}));

// Mock memory
vi.mock('../agents/memory.js', () => ({
  getHistory: vi.fn(() => []),
  appendHistory: vi.fn(),
}));

import { classifyIntent, formatContextNote, runAgent } from '../agents/orchestrator.js';
import { appendHistory } from '../agents/memory.js';
import {
  runMixologistAgent,
  runInventoryAgent,
  runRecipeAgent,
  runLibraryAgent,
} from '../agents/subagents.js';

describe('orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── classifyIntent ──────────────────────────────────────────────────────────
  describe('classifyIntent', () => {
    it('classifies "what do i have" as inventory', () => {
      expect(classifyIntent('What do I have in my bar?')).toBe('inventory');
    });

    it('classifies "my bottles" as inventory', () => {
      expect(classifyIntent('Show me my bottles')).toBe('inventory');
    });

    it('classifies "what can i make" as inventory', () => {
      expect(classifyIntent('What can I make tonight?')).toBe('inventory');
    });

    it('classifies "shopping list" as inventory', () => {
      expect(classifyIntent('Add gin to my shopping list')).toBe('inventory');
    });

    it('classifies "where can i buy" as inventory', () => {
      expect(classifyIntent('Where can I buy Hendricks gin?')).toBe('inventory');
    });

    it('routes to inventory when ctx.type === spirit', () => {
      expect(classifyIntent('Tell me about this', { type: 'spirit', id: 1, name: 'Gin', summary: null })).toBe('inventory');
    });

    it('classifies "what is missing from my library" as library', () => {
      expect(classifyIntent('What is missing from my library?')).toBe('library');
    });

    it('classifies "analyze my collection" as library', () => {
      expect(classifyIntent('Please analyze my collection')).toBe('library');
    });

    it('classifies "what should i add" as library', () => {
      expect(classifyIntent('What should I add to my library?')).toBe('library');
    });

    it('classifies "gaps in my collection" as library', () => {
      expect(classifyIntent('Are there gaps in my current collection?')).toBe('library');
    });

    it('classifies "delete recipe" as library', () => {
      expect(classifyIntent('Remove a recipe from my library')).toBe('library');
    });

    it('classifies "how to make a mojito" as recipe', () => {
      expect(classifyIntent('How do I make a mojito?')).toBe('recipe');
    });

    it('classifies "recipe for negroni" as recipe', () => {
      expect(classifyIntent('Recipe for a negroni')).toBe('recipe');
    });

    it('classifies "ingredients for margarita" as recipe', () => {
      expect(classifyIntent('What ingredients do I need for a margarita?')).toBe('recipe');
    });

    it('classifies "variations of old fashioned" as recipe', () => {
      expect(classifyIntent('Show me variations of the old fashioned')).toBe('recipe');
    });

    it('routes to recipe when ctx.type === recipe', () => {
      expect(classifyIntent('Tell me about this', { type: 'recipe', id: 1, name: 'Mojito', summary: null })).toBe('recipe');
    });

    it('classifies "what is a good cocktail" as mixologist', () => {
      expect(classifyIntent('What is a good cocktail for a party?')).toBe('mixologist');
    });

    it('classifies "hello" as mixologist (default)', () => {
      expect(classifyIntent('Hello there!')).toBe('mixologist');
    });

    it('classifies "my bar" as inventory', () => {
      expect(classifyIntent('Tell me about my bar')).toBe('inventory');
    });

    it('classifies "my stock" as inventory', () => {
      expect(classifyIntent("What's in my stock?")).toBe('inventory');
    });

    it('classifies "i have got" as inventory', () => {
      expect(classifyIntent("I've got some bourbon")).toBe('inventory');
    });

    it('classifies "where to buy" as inventory', () => {
      expect(classifyIntent('Where to buy Campari?')).toBe('inventory');
    });

    it('classifies "buy online" as inventory', () => {
      expect(classifyIntent('I want to buy online')).toBe('inventory');
    });

    it('classifies "how much is" as inventory', () => {
      expect(classifyIntent('How much is a bottle of Hendricks?')).toBe('inventory');
    });

    it('classifies "price of" as inventory', () => {
      expect(classifyIntent('Price of Maker\'s Mark')).toBe('inventory');
    });

    it('classifies "find nearby" as inventory', () => {
      expect(classifyIntent('Find gin near me')).toBe('inventory');
    });

    it('classifies "local store" as inventory', () => {
      expect(classifyIntent('Any local store that sells absinthe?')).toBe('inventory');
    });

    it('classifies "liquor store" as inventory', () => {
      expect(classifyIntent('Is there a liquor store near here?')).toBe('inventory');
    });

    it('classifies "online order" as inventory', () => {
      expect(classifyIntent('Can I place an online order for this?')).toBe('inventory');
    });

    it('classifies "order online" as inventory', () => {
      expect(classifyIntent('I want to order online')).toBe('inventory');
    });

    it('classifies "purchase" as inventory', () => {
      expect(classifyIntent('Where can I purchase this?')).toBe('inventory');
    });

    it('classifies "retailer" as inventory', () => {
      expect(classifyIntent('Any retailer that ships this?')).toBe('inventory');
    });

    it('classifies "ship to" as inventory', () => {
      expect(classifyIntent('Can they ship to California?')).toBe('inventory');
    });

    it('classifies "delivers" as inventory', () => {
      expect(classifyIntent('Who delivers alcohol?')).toBe('inventory');
    });

    it('classifies "add to list" as inventory', () => {
      expect(classifyIntent('Add tequila to my list')).toBe('inventory');
    });

    it('classifies "library review" as library', () => {
      expect(classifyIntent('Give me a library review')).toBe('library');
    });

    it('classifies "improve library" as library', () => {
      expect(classifyIntent('How can I improve my library?')).toBe('library');
    });

    it('classifies "curate" as library', () => {
      expect(classifyIntent('Help me curate my recipes')).toBe('library');
    });

    it('classifies "what cocktails should I add" as library', () => {
      expect(classifyIntent('What cocktails should I add?')).toBe('library');
    });

    it('classifies "not enough" as library', () => {
      expect(classifyIntent('Not enough gin recipes')).toBe('library');
    });

    it('classifies "too many" as library', () => {
      expect(classifyIntent('Too many whiskey recipes')).toBe('library');
    });

    it('classifies "recommend add" as library', () => {
      expect(classifyIntent('Recommend a recipe to add')).toBe('library');
    });

    it('classifies "step by step" as recipe', () => {
      expect(classifyIntent('Give me the steps for a daiquiri')).toBe('recipe');
    });

    it('classifies "garnish" as recipe', () => {
      expect(classifyIntent('What garnish goes on a martini?')).toBe('recipe');
    });

    it('classifies "show me how" as recipe', () => {
      expect(classifyIntent('Show me how to make one')).toBe('recipe');
    });

    it('classifies "walk me through" as recipe', () => {
      expect(classifyIntent('Walk me through the Negroni recipe')).toBe('recipe');
    });

    it('classifies "what goes in" as recipe', () => {
      expect(classifyIntent('What goes in a mojito?')).toBe('recipe');
    });

    it('classifies "what do i need to make" as recipe', () => {
      expect(classifyIntent('What do I need to make a Cosmopolitan?')).toBe('recipe');
    });

    it('classifies "how do you mix" as recipe', () => {
      expect(classifyIntent('How do you mix a Manhattan?')).toBe('recipe');
    });

    it('classifies "how is it made" as recipe', () => {
      expect(classifyIntent('How is it made?')).toBe('recipe');
    });

    it('classifies "riff on" as recipe', () => {
      expect(classifyIntent('Give me a riff on the Old Fashioned')).toBe('recipe');
    });

    it('classifies "cocktail riff" as recipe', () => {
      expect(classifyIntent('Any cocktail riff ideas?')).toBe('recipe');
    });

    it('classifies "alternative to" as recipe', () => {
      expect(classifyIntent('Alternative to a Negroni?')).toBe('recipe');
    });

    it('classifies "twist on" as recipe', () => {
      expect(classifyIntent('Give me a twist on the classic Martini')).toBe('recipe');
    });

    it('classifies "modify" as recipe', () => {
      expect(classifyIntent('Can I modify this recipe?')).toBe('recipe');
    });

    it('classifies "modification" as recipe', () => {
      expect(classifyIntent('Any modification ideas?')).toBe('recipe');
    });

    it('classifies "technique" as recipe', () => {
      expect(classifyIntent('What technique is used?')).toBe('recipe');
    });
  });

  // ── formatContextNote ───────────────────────────────────────────────────────
  describe('formatContextNote', () => {
    it('returns empty string when no context', () => {
      expect(formatContextNote()).toBe('');
      expect(formatContextNote(undefined)).toBe('');
    });

    it('returns empty string when type is null', () => {
      expect(formatContextNote({ type: null, id: null, name: null, summary: null })).toBe('');
    });

    it('returns recipe context note', () => {
      const note = formatContextNote({ type: 'recipe', id: 42, name: 'Mojito', summary: null });
      expect(note).toContain('Mojito');
      expect(note).toContain('recipe ID: 42');
    });

    it('includes no-video hint when summary includes hasYoutubeUrl: false', () => {
      const note = formatContextNote({
        type: 'recipe',
        id: 5,
        name: 'Daiquiri',
        summary: 'complexity: Easy, hasYoutubeUrl: false',
      });
      expect(note).toContain('backfillRecipeYouTube');
      expect(note).toContain('Additional context');
    });

    it('returns recipe context without video hint when hasYoutubeUrl is not false', () => {
      const note = formatContextNote({
        type: 'recipe',
        id: 5,
        name: 'Daiquiri',
        summary: 'complexity: Easy, hasYoutubeUrl: true',
      });
      expect(note).not.toContain('backfillRecipeYouTube');
    });

    it('handles recipe with null id', () => {
      const note = formatContextNote({ type: 'recipe', id: null, name: 'Test', summary: null });
      expect(note).toContain('recipe ID: unknown');
    });

    it('handles recipe with null id in video hint', () => {
      const note = formatContextNote({ type: 'recipe', id: null, name: 'Test', summary: 'hasYoutubeUrl: false' });
      expect(note).toContain('recipeId=0');
    });

    it('returns spirit context note', () => {
      const note = formatContextNote({ type: 'spirit', id: 7, name: 'Hendricks Gin', summary: null });
      expect(note).toContain('Hendricks Gin');
      expect(note).toContain('bottle ID: 7');
      expect(note).toContain('findWhereToBuy');
    });

    it('handles spirit with null id', () => {
      const note = formatContextNote({ type: 'spirit', id: null, name: 'Gin', summary: null });
      expect(note).toContain('bottle ID: unknown');
      expect(note).toContain('bottleId=null');
    });

    it('returns recipes browsing context', () => {
      const note = formatContextNote({ type: 'recipes', id: null, name: null, summary: null });
      expect(note).toContain('browsing the recipe library');
    });

    it('returns home context', () => {
      const note = formatContextNote({ type: 'home', id: null, name: null, summary: null });
      expect(note).toContain('home screen');
    });

    it('includes summary when present', () => {
      const note = formatContextNote({ type: 'home', id: null, name: null, summary: 'extra info' });
      expect(note).toContain('Additional context: extra info');
    });

    it('returns empty string for unknown type with no name', () => {
      const note = formatContextNote({ type: 'other', id: null, name: null, summary: null });
      expect(note).toBe('');
    });
  });

  // ── runAgent ────────────────────────────────────────────────────────────────
  describe('runAgent', () => {
    it('routes to mixologist agent for general chat', async () => {
      const events = [];
      for await (const e of runAgent('u1', 's1', 'Hello there!')) events.push(e);
      expect(runMixologistAgent).toHaveBeenCalled();
      expect(events.some((e: any) => e.type === 'token')).toBe(true);
    });

    it('routes to inventory agent for inventory questions', async () => {
      const events = [];
      for await (const e of runAgent('u1', 's1', 'What do I have in my bar?')) events.push(e);
      expect(runInventoryAgent).toHaveBeenCalled();
    });

    it('routes to recipe agent for recipe questions', async () => {
      const events = [];
      for await (const e of runAgent('u1', 's1', 'How do I make a Mojito?')) events.push(e);
      expect(runRecipeAgent).toHaveBeenCalled();
    });

    it('routes to library agent for library questions', async () => {
      const events = [];
      for await (const e of runAgent('u1', 's1', 'What is missing from my library?')) events.push(e);
      expect(runLibraryAgent).toHaveBeenCalled();
    });

    it('appends history for user and assistant turns', async () => {
      const events = [];
      for await (const e of runAgent('u1', 's1', 'Hey!')) events.push(e);
      expect(appendHistory).toHaveBeenCalledWith(
        's1',
        { role: 'user', content: 'Hey!' },
        { role: 'assistant', content: 'mix-response' },
      );
    });

    it('passes page context to the agent function', async () => {
      const ctx: PageContext = { type: 'spirit', id: 3, name: 'Vodka', summary: null };
      for await (const _ of runAgent('u1', 's1', 'Tell me about this', ctx)) { /* drain */ }
      expect(runInventoryAgent).toHaveBeenCalled();
      const call = (runInventoryAgent as any).mock.calls[0];
      expect(call[0]).toBe('u1');
      expect(call[2]).toContain('Vodka');
    });

    it('does not append history when there is no text output', async () => {
      // Mock a subagent that yields only done
      const { runMixologistAgent: mock } = await import('../agents/subagents.js');
      (mock as any).mockImplementationOnce(function* () { yield { type: 'done' }; });
      for await (const _ of runAgent('u1', 's2', 'Hi')) { /* drain */ }
      // appendHistory should NOT be called for session s2 because fullText is empty
      const calls = (appendHistory as any).mock.calls.filter((c: any) => c[0] === 's2');
      expect(calls.length).toBe(0);
    });

    it('handles token events where text is undefined (coalesces to empty)', async () => {
      const { runMixologistAgent: mock } = await import('../agents/subagents.js');
      (mock as any).mockImplementationOnce(function* () {
        yield { type: 'token', text: undefined, agent: 'Mixologist' };
        yield { type: 'token', text: 'real', agent: 'Mixologist' };
        yield { type: 'done' };
      });
      const events: any[] = [];
      for await (const e of runAgent('u1', 's3', 'Hey!')) events.push(e);
      // fullText should be 'real' (not 'undefinedreal')
      expect(appendHistory).toHaveBeenCalledWith(
        's3',
        { role: 'user', content: 'Hey!' },
        { role: 'assistant', content: 'real' },
      );
    });
  });
});
