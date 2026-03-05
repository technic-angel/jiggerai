import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract all unique YouTube video IDs from a block of text. */
function extractYoutubeIds(text: string): string[] {
  const re = /(?:youtube\.com\/watch\?(?:[^"'\s]*&)*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g;
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) ids.add(m[1]!);
  return [...ids];
}

/** Remove bare YouTube URLs from text so they don't render as raw links. */
function stripYoutubeUrls(text: string): string {
  return text.replace(
    /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?(?:[^\s"'<>]*&)*v=[A-Za-z0-9_-]{11}[^\s"'<>]*|youtu\.be\/[A-Za-z0-9_-]{11}[^\s"'<>]*)/g,
    ""
  ).replace(/\s{2,}/g, " ").trim();
}

/** True if the message text looks like a full cocktail recipe. */
function looksLikeRecipe(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes("ingredient") && lower.includes("instruction")) ||
    (lower.includes("ingredient") && lower.includes("oz ")) ||
    (lower.includes("step") && lower.includes("oz "))
  );
}

/**
 * Try to pull a cocktail name out of the message text.
 * Looks for bold headings like **The Gimlet** or **The Negroni 🍊**.
 */
function extractCocktailName(text: string): string | null {
  const m = text.match(/\*\*(?:The\s+)?([A-Z][A-Za-z\s'-]+?)(?:\s+[\p{Emoji}])?\*\*/u);
  return m ? m[1]!.trim() : null;
}

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (text: string) => void;
  showSuggestions?: boolean;
  /** Called when the user clicks "Add to Library" for a suggested cocktail */
  onAddToLibrary?: (cocktailName: string, recipeData: Record<string, unknown>) => void;
}

export function ChatMessage({ message, onSuggestionClick, showSuggestions, onAddToLibrary }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isTyping = !isUser && message.isStreaming && message.content === "";

  // ── Derived data (memoised so it doesn't recalculate on every render) ──────
  const inlineYoutubeIds = useMemo(
    () => (isUser ? [] : extractYoutubeIds(message.content)),
    [isUser, message.content]
  );

  // Merge tool-result videos (from SSE) with inline-parsed ones, deduplicated.
  const allYoutubeVideos = useMemo(() => {
    const toolVideos = message.youtubeVideos ?? [];
    const toolIds = new Set(toolVideos.map((v) => v.videoId));
    const extra = inlineYoutubeIds
      .filter((id) => !toolIds.has(id))
      .map((id) => ({ videoId: id, title: "Watch on YouTube", thumbnail: "" }));
    return [...toolVideos, ...extra];
  }, [message.youtubeVideos, inlineYoutubeIds]);

  // Show the Add to Library button when:
  //  a) the tool called proposeAddToLibrary (addButtons from SSE), OR
  //  b) the message is done streaming and looks like a full recipe
  const showAddButton = !isUser && !message.isStreaming && (
    (message.addButtons && message.addButtons.length > 0) ||
    looksLikeRecipe(message.content)
  );

  // For the fallback "add" button we need a cocktail name. Prefer the one from
  // the tool result, then try to extract it from the message text.
  const addButtonLabel = useMemo(() => {
    if (message.addButtons && message.addButtons.length > 0) return null; // use tool buttons
    return extractCocktailName(message.content) ?? "this cocktail";
  }, [message.addButtons, message.content]);

  // Strip raw YouTube URLs from markdown text so they don't render as plain links.
  const cleanContent = useMemo(
    () => (isUser ? message.content : stripYoutubeUrls(message.content)),
    [isUser, message.content]
  );

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
                {cleanContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* YouTube video embeds — from tool results or parsed from message text */}
        {!isUser && allYoutubeVideos.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 w-full">
            {allYoutubeVideos.map((v) => (
              <div
                key={v.videoId}
                className="overflow-hidden rounded-xl ring-1 ring-white/10 bg-zinc-900"
              >
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${v.videoId}?rel=0&modestbranding=1`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {v.title && v.title !== "Watch on YouTube" && (
                  <p className="px-2.5 py-1.5 text-xs text-zinc-400 truncate">{v.title}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Where to Buy retailer cards — inline in chat so they appear regardless of which page is mounted */}
        {!isUser && message.whereToBuyCards && message.whereToBuyCards.results.length > 0 && (
          <div className="mt-2 w-full">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Where to buy · {message.whereToBuyCards.ingredientName}
            </p>
            <div className="flex flex-col gap-1.5">
              {message.whereToBuyCards.results.map((r) => (
                <a
                  key={r.store}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-zinc-900/60 px-3 py-2.5 text-left transition-colors hover:border-teal-500/40 hover:bg-zinc-800/80"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-100">{r.store}</p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-400">{r.deliveryNote}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-teal-300">{r.priceRange}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {r.type === 'local' ? '📍 Local' : r.type === 'search' ? '🔍 Search' : '🛒 Online'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Add to Library — shown when the tool proposed it OR the message looks like a full recipe */}
        {showAddButton && (
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Buttons from tool results (have cocktail name + metadata) */}
            {message.addButtons && message.addButtons.length > 0
              ? message.addButtons.map((btn) => (
                  <button
                    key={btn.cocktailName}
                    onClick={() => onAddToLibrary?.(btn.cocktailName, btn.recipeData)}
                    className="flex items-center gap-1.5 rounded-full border border-teal-500/50 bg-teal-500/15 px-3.5 py-1.5 text-xs font-medium text-teal-300 transition-colors hover:border-teal-400 hover:bg-teal-500/25 hover:text-teal-100 active:scale-95"
                  >
                    <span className="text-base leading-none">＋</span>
                    Add "{btn.cocktailName}" to Library
                  </button>
                ))
              : /* Fallback button extracted from message text */
                (
                  <button
                    onClick={() => onAddToLibrary?.(addButtonLabel!, {})}
                    className="flex items-center gap-1.5 rounded-full border border-teal-500/50 bg-teal-500/15 px-3.5 py-1.5 text-xs font-medium text-teal-300 transition-colors hover:border-teal-400 hover:bg-teal-500/25 hover:text-teal-100 active:scale-95"
                  >
                    <span className="text-base leading-none">＋</span>
                    Add "{addButtonLabel}" to Library
                  </button>
                )
            }
          </div>
        )}

        {/* Suggestion chips — only for the most recent assistant message */}
        {!isUser && showSuggestions && !message.isStreaming && message.suggestions && message.suggestions.length > 0 && (
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
