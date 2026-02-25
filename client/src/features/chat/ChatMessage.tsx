import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
          isUser
            ? "bg-muted text-foreground"
            : "bg-transparent text-foreground"
        )}
      >
        {/* Agent name badge for assistant messages */}
        {!isUser && message.agentName && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20">
              <img
                src="/jigger-logo.svg"
                alt=""
                className="h-3 w-3"
              />
            </div>
            <span className="text-xs font-semibold text-teal-400">
              {message.agentName}
            </span>
          </div>
        )}

        {/* Message content */}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
