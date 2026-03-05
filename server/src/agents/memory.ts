// server/src/agents/memory.ts
//
// Session message history — replaces ADK's InMemorySessionService.
// Each sessionId maps to an array of messages (user + assistant turns).
// Upgrade path: swap the Map for Redis to persist across server restarts.

import type { ModelMessage } from 'ai';

const sessions = new Map<string, ModelMessage[]>();

export function getHistory(sessionId: string): ModelMessage[] {
  return sessions.get(sessionId) ?? [];
}

export function appendHistory(sessionId: string, ...messages: ModelMessage[]) {
  const history = sessions.get(sessionId) ?? [];
  sessions.set(sessionId, [...history, ...messages]);
}

export function clearHistory(sessionId: string) {
  sessions.delete(sessionId);
}
