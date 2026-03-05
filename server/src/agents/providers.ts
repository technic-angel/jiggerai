// server/src/agents/providers.ts
//
// Single place to configure and swap LLM providers.
// FALLBACK_CHAIN is tried in order — next provider is used on a rate-limit hit.

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

// ─── Groq ──────────────────────────────────────────────────────────────────
// Primary — generous free tier, very fast (llama-3.3-70b on Groq infra)
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY ?? '',
});

// ─── Google Gemini ─────────────────────────────────────────────────────────────────────────────────────────────────
// Secondary ─ reliable, cheap, 1M context window
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY ?? '',
});

// ─── xAI / Grok ────────────────────────────────────────────────────────────────────────────────────────────────────
// Tertiary ─ uncomment when you add credits at console.x.ai
const xai = createXai({
  apiKey: process.env.XAI_API_KEY ?? '',
});

// ─── Fallback chain (general chat — Groq first for speed/cost) ────────────
// Tried in order on rate-limit. Groq is fast and free but unreliable for
// function calling, so tool-using agents use TOOL_CHAIN below instead.
export const FALLBACK_CHAIN: LanguageModel[] = [
  groq('llama-3.3-70b-versatile'),   // 1st — fast + generous free tier
  google('gemini-2.5-flash'),         // 2nd — reliable fallback
  // xai('grok-3-fast'),              // 3rd — uncomment when xAI has credits
];

// ─── Tool chain (agents that call DB tools — needs reliable function calling)
// Groq's function calling is flaky so we skip it here. Google handles it well.
export const TOOL_CHAIN: LanguageModel[] = [
  google('gemini-2.5-flash'),
  // xai('grok-3-fast'),              // add when xAI has credits
];

// ─── Legacy single-model export (kept for any direct references) ───────────
export const MODELS: Record<string, LanguageModel> = {
  mixologist: FALLBACK_CHAIN[0]!,
  fallback:   TOOL_CHAIN[0]!,
};
