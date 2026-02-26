import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "@/types";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  onSuggestionClick?: (text: string) => void;
}

export function ChatMessageList({ messages, onSuggestionClick }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80">
      <div className="flex flex-col gap-4 px-3 py-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSuggestionClick={onSuggestionClick}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
