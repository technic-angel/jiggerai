import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "@/types";
import { ChatMessage } from "./ChatMessage";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  onSuggestionClick?: (text: string) => void;
  onAddToLibrary?: (cocktailName: string, recipeData: Record<string, unknown>) => void;
}

export function ChatMessageList({ messages, onSuggestionClick, onAddToLibrary }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll the chat container itself — never the page
  useEffect(() => {
    const el = scrollRef.current;
    /* v8 ignore next */
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Only show suggestion chips on the last assistant message so old chips
  // don't persist in the history after the user has already clicked them.
  const lastAssistantIndex = messages.reduce(
    (last, msg, i) => (msg.role === "assistant" ? i : last),
    -1
  );

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900/50 to-zinc-950/80"
    >
      <div className="flex flex-col gap-4 px-3 py-4">
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSuggestionClick={onSuggestionClick}
            showSuggestions={i === lastAssistantIndex}
            onAddToLibrary={onAddToLibrary}
          />
        ))}
      </div>
    </div>
  );
}
