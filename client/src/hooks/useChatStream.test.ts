import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatStream } from './useChatStream';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

/** Helper to build a mock ReadableStream reader from SSE lines */
function makeReader(lines: string[]) {
  const encoder = new TextEncoder();
  let idx = 0;
  return {
    read: vi.fn().mockImplementation(() => {
      if (idx < lines.length) {
        return Promise.resolve({ done: false, value: encoder.encode(lines[idx++] + '\n\n') });
      }
      return Promise.resolve({ done: true, value: undefined });
    }),
  };
}

describe('useChatStream', () => {
  beforeEach(() => {
    const store = useChatStore.getState();
    store.clearMessages();
    store.setStreaming(false);
    useUIStore.setState({
      pageContext: { type: null, id: null, name: null, summary: null },
    });
    vi.restoreAllMocks();
  });

  it('returns sendMessage and cancel functions', () => {
    const { result } = renderHook(() => useChatStream());
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('sendMessage adds user and assistant messages to store', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"token","text":"Hello"}',
        'data: {"type":"done"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('Hi there'); });

    const messages = useChatStore.getState().messages;
    expect(messages.length).toBeGreaterThanOrEqual(2);
    const userMsg = messages.find(m => m.role === 'user' && m.content === 'Hi there');
    expect(userMsg).toBeDefined();
    const assistantMsg = messages.find(m => m.role === 'assistant' && m.content.includes('Hello'));
    expect(assistantMsg).toBeDefined();
  });

  it('handles fetch error gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    const messages = useChatStore.getState().messages;
    const assistantMsg = messages.find(m => m.role === 'assistant');
    expect(assistantMsg?.content).toContain('Network error');
  });

  it('handles HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    const messages = useChatStore.getState().messages;
    const assistantMsg = messages.find(m => m.role === 'assistant');
    expect(assistantMsg?.content).toContain('HTTP 500');
  });

  it('sets streaming false after completion', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it('cancel aborts the stream', () => {
    const { result } = renderHook(() => useChatStream());
    act(() => { result.current.cancel(); });
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it('handles youtube SSE event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"youtube","videoId":"abc123def45","title":"Negroni","thumbnail":"http://t.jpg"}',
        'data: {"type":"done"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('show me a video'); });

    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.youtubeVideos).toHaveLength(1);
    expect(last.youtubeVideos![0].videoId).toBe('abc123def45');
  });

  it('stores youtube override when viewing a recipe', async () => {
    useUIStore.setState({
      pageContext: { type: 'recipe', id: 42, name: 'Negroni', summary: '' },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"youtube","videoId":"xyz789","title":"Negroni","thumbnail":""}',
        'data: {"type":"done"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('find video'); });

    expect(useUIStore.getState().recipeYouTubeOverrides[42]).toBe('xyz789');
  });

  it('handles where_to_buy SSE event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"where_to_buy","ingredientName":"Hendricks Gin","bottleId":1,"results":[{"store":"Drizly","priceRange":"$30","deliveryNote":"1d","url":"http://d.com","logo":"","type":"online"}]}',
        'data: {"type":"done"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('where to buy gin'); });

    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.whereToBuyCards?.ingredientName).toBe('Hendricks Gin');
    // Also stored in uiStore
    expect(useUIStore.getState().whereToBuyResults['hendricks gin']).toBeDefined();
  });

  it('handles add_button SSE event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"add_button","cocktailName":"Negroni","recipeData":{"ingredients":["gin"]}}',
        'data: {"type":"done"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('add negroni'); });

    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.addButtons).toHaveLength(1);
    expect(last.addButtons![0].cocktailName).toBe('Negroni');
  });

  it('handles token event with agent name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"token","text":"Hi","agent":"Bartender"}',
        'data: {"type":"done"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('hello'); });

    expect(useChatStore.getState().currentAgentName).toBeNull(); // reset in finally
  });

  it('handles error SSE event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"error","message":"Rate limit exceeded"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.content).toContain('Rate limit exceeded');
  });

  it('handles AbortError (user canceled)', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.content).toContain('canceled');
  });

  it('finally block marks message done and resets streaming/agent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader(['data: {"type":"done"}']) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    expect(useChatStore.getState().isStreaming).toBe(false);
    expect(useChatStore.getState().currentAgentName).toBeNull();
    // Last message should not be streaming
    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.isStreaming).toBe(false);
  });

  it('handles malformed JSON in SSE gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {invalid json}',
        'data: {"type":"token","text":"ok"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SSE]'), expect.anything());
    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.content).toContain('ok');
    consoleSpy.mockRestore();
  });

  it('sends pageContext when type is set', async () => {
    useUIStore.setState({
      pageContext: { type: 'spirit', id: 1, name: 'Gin', summary: 'Test' },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    expect(fetch).toHaveBeenCalledWith('/api/chat/stream', expect.objectContaining({
      body: expect.stringContaining('"pageContext"'),
    }));
  });

  it('handles error event without message field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => makeReader([
        'data: {"type":"error"}',
      ]) },
    }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => { await result.current.sendMessage('test'); });

    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.content).toContain('Something went wrong');
  });
});
