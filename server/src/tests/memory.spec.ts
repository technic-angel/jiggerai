/**
 * Tests for agents/memory.ts — in-memory session history store.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getHistory, appendHistory, clearHistory } from '../agents/memory.js';

describe('memory', () => {
  const SESSION = 'test-session-001';

  beforeEach(() => {
    clearHistory(SESSION);
  });

  describe('getHistory', () => {
    it('returns an empty array for a new session', () => {
      expect(getHistory('nonexistent-session')).toEqual([]);
    });

    it('returns stored messages for an existing session', () => {
      appendHistory(SESSION, { role: 'user', content: 'hello' });
      expect(getHistory(SESSION)).toEqual([{ role: 'user', content: 'hello' }]);
    });
  });

  describe('appendHistory', () => {
    it('creates a new session when appending to a nonexistent one', () => {
      appendHistory('brand-new', { role: 'user', content: 'first' });
      expect(getHistory('brand-new')).toEqual([{ role: 'user', content: 'first' }]);
      clearHistory('brand-new');
    });

    it('appends multiple messages to an existing session', () => {
      appendHistory(SESSION, { role: 'user', content: 'a' });
      appendHistory(SESSION, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' });
      expect(getHistory(SESSION)).toEqual([
        { role: 'user', content: 'a' },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'c' },
      ]);
    });
  });

  describe('clearHistory', () => {
    it('removes the session so getHistory returns empty', () => {
      appendHistory(SESSION, { role: 'user', content: 'keep me' });
      clearHistory(SESSION);
      expect(getHistory(SESSION)).toEqual([]);
    });

    it('does not throw when clearing a nonexistent session', () => {
      expect(() => clearHistory('nope')).not.toThrow();
    });
  });
});
