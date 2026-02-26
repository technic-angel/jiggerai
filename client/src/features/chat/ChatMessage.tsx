import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (text: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isTyping = !isUser && message.isStreaming && message.content === "";

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar dot for assistant */}
      {!isUser && (
        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 ring-1 ring-teal-500/30">
          <img src="/jigger-logo.svg" alt="" className="h-3.5 w-3.5" />
        </div>
      )}

      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {/* Agent name */}
        {!isUser && message.agentName && (
          <span className="px-1 text-[11px] font-semibold tracking-wide text-teal-400">
            {message.agentName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-teal-600 text-white"
              : "rounded-tl-sm bg-zinc-800/80 text-zinc-100 ring-1 ring-white/5"
          )}
        >
          {isTyping ? (
            /* Animated typing dots */
            <span className="flex items-center gap-1 py-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
            </span>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-white prose-a:text-teal-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Suggestion chips — only for assistant messages with suggestions */}
        {!isUser && !message.isStreaming && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {message.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick?.(s)}
                className="rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs text-teal-300 transition-colors hover:border-teal-400/60 hover:bg-teal-500/20 hover:text-teal-200 active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
