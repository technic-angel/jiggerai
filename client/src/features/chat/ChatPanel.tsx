import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/store/chatStore";
import { useUIStore } from "@/store/uiStore";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

interface ChatPanelProps {
  width?: number;
}

export function ChatPanel({ width }: ChatPanelProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const currentAgentName = useChatStore((s) => s.currentAgentName);
  const closeChat = useUIStore((s) => s.closeChat);
  const pageContext = useUIStore((s) => s.pageContext);
  const pendingChatMessage = useUIStore((s) => s.pendingChatMessage);
  const clearPendingChatMessage = useUIStore((s) => s.clearPendingChatMessage);
  const queryClient = useQueryClient();

  // Hook handles all SSE streaming: user messages, agent responses, token streaming
  const { sendMessage } = useChatStream();

  // Auto-send any message that was queued from another page (e.g. variation request
  // from RecipeDetailView). Wait until not streaming so it doesn't interrupt.
  useEffect(() => {
    if (pendingChatMessage && !isStreaming) {
      sendMessage(pendingChatMessage);
      clearPendingChatMessage();
    }
  }, [pendingChatMessage, isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend(content: string) {
    // sendMessage() handles everything:
    // 1. Adding user message to chat
    // 2. Creating empty assistant message
    // 3. POSTing to /api/chat/stream
    // 4. Streaming tokens back in real-time
    sendMessage(content);
  }

  async function handleAddToLibrary(cocktailName: string, recipeData: Record<string, unknown>) {
    // If we have full recipe data from the tool result, POST directly — no extra AI roundtrip.
    if (recipeData && recipeData.ingredients && Array.isArray(recipeData.ingredients) && recipeData.instructions) {
      try {
        // imageUrl comes from CocktailDB (set server-side in proposeAddToLibrary)
        const body = {
          name: recipeData.name ?? cocktailName,
          category: recipeData.category ?? 'Cocktail',
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          youtubeUrl: recipeData.youtubeUrl ?? null,
          imageUrl: recipeData.imageUrl ?? null,
          baseSpirit: recipeData.baseSpirit ?? null,
          abv: recipeData.abv ?? null,
          glassType: recipeData.glassType ?? null,
          difficulty: recipeData.difficulty ?? null,
          imageEmoji: recipeData.imageEmoji ?? null,
          equipment: recipeData.equipment ?? null,
        };
        const res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          // Invalidate React Query cache so the recipe list updates immediately
          queryClient.invalidateQueries({ queryKey: ['recipes'] });
          // Add a synthetic success message to the chat
          const { addMessage } = useChatStore.getState();
          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `✅ **"${cocktailName}"** has been added to your cocktail library!${recipeData.youtubeVideoId ? ' The video tutorial has been saved too.' : ''}`,
            timestamp: new Date(),
            agentName: 'Mixologist',
          });
          return;
        }
      } catch {
        // fall through to AI message
      }
    }
    // Fallback: send a chat message so the AI handles it (e.g. no ingredients available)
    sendMessage(`Please add "${cocktailName}" to my cocktail library.`);
  }

  return (
    <div
      className="flex h-full flex-col border-l border-border bg-card"
      style={{ width: width ? `${width}px` : "320px", minWidth: 0 }}
    >
      <ChatHeader agentName={currentAgentName ?? "Mixologist"} onClose={closeChat} />

      {/* Context pill — shows the agent what the user is looking at */}
      {pageContext.type && pageContext.name && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Viewing:</span>
          <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-medium text-teal-300">
            {pageContext.name}
          </span>
        </div>
      )}

      <ChatMessageList messages={messages} onSuggestionClick={sendMessage} onAddToLibrary={handleAddToLibrary} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
