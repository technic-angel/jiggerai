import { useState } from "react";
import { Sparkles, Send, TrendingUp, Wine, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

// ─── Suggestion chip ──────────────────────────────────────────────────────────

interface SuggestionChipProps {
  label: string;
  onClick: () => void;
}

function SuggestionChip({ label, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:border-teal-400/50 hover:bg-teal-400/5 hover:text-teal-300 transition-all"
    >
      {label}
    </button>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompts: string[];
  onPrompt: (p: string) => void;
}

function CategoryCard({ icon, title, description, prompts, onPrompt }: CategoryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <SuggestionChip key={p} label={p} onClick={() => onPrompt(p)} />
        ))}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function SuggestionsView() {
  const [customInput, setCustomInput] = useState("");
  const openChat = useUIStore((s) => s.openChat);
  const setPageContext = useUIStore((s) => s.setPageContext);

  function sendToChat(prompt: string) {
    // Set context so ChatPanel prefills with this prompt on open
    setPageContext({
      type: "home",
      id: null,
      name: "Suggestions",
      summary: `User is exploring suggestions. They asked: "${prompt}"`,
    });
    openChat();
    // Phase B: directly inject this as a user message into chatStore
  }

  function handleCustomSend() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    sendToChat(trimmed);
    setCustomInput("");
  }

  const categories = [
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Cocktail Ideas",
      description: "Discover new drinks to try tonight",
      prompts: [
        "What can I make with gin and cucumber?",
        "Suggest a smoky cocktail",
        "What's a good low-ABV drink?",
        "Something refreshing for summer",
        "Classic cocktails I should know",
      ],
    },
    {
      icon: <Wine className="h-4 w-4" />,
      title: "Spirit Exploration",
      description: "Learn about new bottles to add to your bar",
      prompts: [
        "What's a good entry-level bourbon?",
        "Recommend a mezcal under $50",
        "Best rum for daiquiris",
        "What's the difference between scotch regions?",
        "Interesting liqueurs I should try",
      ],
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      title: "Technique & Tips",
      description: "Improve your bartending skills",
      prompts: [
        "How do I properly stir a cocktail?",
        "When should I shake vs stir?",
        "What's the best way to express a citrus peel?",
        "How do I make a fat-washed spirit?",
        "Tips for building a home bar on a budget",
      ],
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Trending Now",
      description: "What's popular in the cocktail world",
      prompts: [
        "What are 2025's biggest cocktail trends?",
        "Tell me about clarified cocktails",
        "What is a Hugo Spritz?",
        "Non-alcoholic spirit alternatives",
        "Japanese whisky recommendations",
      ],
    },
    {
      icon: <Star className="h-4 w-4" />,
      title: "Personalized For You",
      description: "Based on what's in your bar",
      prompts: [
        "What can I make with what's in my bar right now?",
        "Suggest cocktails I haven't tried yet",
        "What should I add to my bar next?",
        "Help me use up my vermouth before it goes bad",
        "What pairs well with my current spirits?",
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suggestions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore new cocktail ideas and spirits. Click any prompt to open a conversation with your AI mixologist.
        </p>
      </div>

      {/* Custom prompt input */}
      <div className="rounded-2xl border border-teal-400/30 bg-teal-400/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-teal-400" />
          <span className="text-sm font-semibold text-teal-300">Ask anything</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSend()}
            placeholder="e.g. What's a good cocktail for a whiskey beginner?"
            className="h-10 flex-1 rounded-lg border border-teal-400/30 bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
          />
          <Button
            onClick={handleCustomSend}
            disabled={!customInput.trim()}
            className="h-10 gap-2 bg-teal-500 px-4 text-white hover:bg-teal-600 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            Ask
          </Button>
        </div>
        <p className="mt-2 text-xs text-teal-300/60">
          Pressing Ask opens the chat panel with your question ready to go.
        </p>
      </div>

      {/* Category cards */}
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {categories.map((cat) => (
          <CategoryCard key={cat.title} {...cat} onPrompt={sendToChat} />
        ))}
      </div>
    </div>
  );
}
