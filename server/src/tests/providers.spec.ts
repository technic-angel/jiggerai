/**
 * Tests for agents/providers.ts — LLM provider chain configuration.
 */
import { vi, describe, it, expect } from 'vitest';

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn((model: string) => ({ modelId: model, provider: 'google' }))),
}));
vi.mock('@ai-sdk/xai', () => ({
  createXai: vi.fn(() => vi.fn((model: string) => ({ modelId: model, provider: 'xai' }))),
}));
vi.mock('@ai-sdk/groq', () => ({
  createGroq: vi.fn(() => vi.fn((model: string) => ({ modelId: model, provider: 'groq' }))),
}));

import { FALLBACK_CHAIN, TOOL_CHAIN, MODELS } from '../agents/providers.js';

describe('providers', () => {
  it('FALLBACK_CHAIN has at least 2 models', () => {
    expect(FALLBACK_CHAIN.length).toBeGreaterThanOrEqual(2);
  });

  it('TOOL_CHAIN has at least 1 model', () => {
    expect(TOOL_CHAIN.length).toBeGreaterThanOrEqual(1);
  });

  it('MODELS exposes mixologist and fallback keys', () => {
    expect(MODELS).toHaveProperty('mixologist');
    expect(MODELS).toHaveProperty('fallback');
  });

  it('FALLBACK_CHAIN[0] is the Groq model', () => {
    expect((FALLBACK_CHAIN[0] as any).provider).toBe('groq');
  });

  it('TOOL_CHAIN[0] is the Google model', () => {
    expect((TOOL_CHAIN[0] as any).provider).toBe('google');
  });
});
