import { useCallback, useRef } from 'react';
import { useChatStore } from '../store/chatStore';

// Dev user ID (replace with real auth later)
const DEV_USER_ID = 'dev-user-001';

/**
 * useChatStream — Hook for streaming chat responses via SSE
 * 
 * This hook handles:
 * - Sending user messages to the backend
 * - Receiving real-time token stream
 * - Updating chat UI progressively
 * - Canceling mid-stream responses
 * 
 * Why EventSource?
 * - Standard browser API for SSE (no extra libraries)
 * - Browser handles reconnection automatically
 * - Perfect for one-way streaming (server → client)
 * 
 * Why AbortController?
 * - Lets us cancel the POST request if user stops
 * - Cleanup if component unmounts mid-stream
 */
export function useChatStream() {
  // Refs for managing request lifecycle
  const abortRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Get store functions
  const {
    addMessage,
    appendTokenToLastMessage,
    markLastMessageDone,
    setStreaming,
    setCurrentAgent,
  } = useChatStore();

  /**
   * sendMessage — Main function to send a message and stream response
   * 
   * Flow:
   * 1. Add user's message to chat
   * 2. Create empty assistant message (will fill with tokens)
   * 3. POST to backend's /api/chat/stream
   * 4. Open SSE EventSource to receive tokens
   * 5. For each token event: append to assistant message
   * 6. Close when done
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const sessionId = `session-${DEV_USER_ID}`;

      // 1. Add user message to chat
      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      });

      // 2. Add empty assistant message (placeholder)
      const assistantMessageId = crypto.randomUUID();
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '', // Will be filled token by token
        timestamp: new Date(),
        isStreaming: true,
        agentName: 'Mixologist',
      });

      setStreaming(true);

      // 3. Cancel any previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        // 4. POST to backend (this initiates the streaming)
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: DEV_USER_ID,
            sessionId,
            message: text,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // 5. Read SSE stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode incoming bytes
          buffer += decoder.decode(value, { stream: true });

          // SSE: split by lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          // Process complete lines
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            try {
              // Parse SSE payload: "data: {json}"
              const payload = JSON.parse(line.slice(6));

              // 6. Handle different event types
              if (payload.type === 'token') {
                // Append token to assistant message
                appendTokenToLastMessage(payload.text);
                
                // Update agent badge (optional)
                if (payload.agent) {
                  setCurrentAgent(payload.agent);
                }
              } else if (payload.type === 'done') {
                // Stream finished
                break;
              } else if (payload.type === 'error') {
                // Stream error message directly — backend already formats it nicely
                appendTokenToLastMessage(payload.message || 'Something went wrong. Please try again.');
              }
            } catch (e) {
              console.warn('[SSE] Parse error:', e);
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User canceled
          appendTokenToLastMessage('\n\n⏸️ Response canceled.');
        } else {
          // Network or other error
          appendTokenToLastMessage(
            `\n\n⚠️ Connection error: ${err.message}`
          );
        }
      } finally {
        markLastMessageDone();
        setStreaming(false);
        setCurrentAgent(null);
      }
    },
    [addMessage, appendTokenToLastMessage, markLastMessageDone, setStreaming, setCurrentAgent]
  );

  /**
   * cancel — Stop the current stream
   * 
   * Cancels the fetch request and closes EventSource,
   * then updates UI state.
   */
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    eventSourceRef.current?.close();
    setStreaming(false);
    setCurrentAgent(null);
  }, [setStreaming, setCurrentAgent]);

  return { sendMessage, cancel };
}