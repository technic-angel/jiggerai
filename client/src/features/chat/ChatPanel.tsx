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

  // Hook handles all SSE streaming: user messages, agent responses, token streaming
  const { sendMessage } = useChatStream();

  function handleSend(content: string) {
    // sendMessage() handles everything:
    // 1. Adding user message to chat
    // 2. Creating empty assistant message
    // 3. POSTing to /api/chat/stream
    // 4. Streaming tokens back in real-time
    sendMessage(content);
  }

  return (
    <div
      className="flex flex-col border-l border-border bg-card"
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

      <ChatMessageList messages={messages} onSuggestionClick={sendMessage} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
