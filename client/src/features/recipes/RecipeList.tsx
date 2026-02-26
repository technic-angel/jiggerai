import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";
import { SPIRIT_EMOJI } from "./recipeSeed";

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyDot({ difficulty }: { difficulty: string | null | undefined }) {
  const colors: Record<string, string> = {
    Easy:   "bg-teal-400",
    Medium: "bg-amber-400",
    Hard:   "bg-red-400",
  };
  const color = difficulty ? (colors[difficulty] ?? "bg-muted") : "bg-muted";
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full shrink-0", color)}
      title={difficulty ?? "Unknown"}
    />
  );
}

// ─── Single row ──────────────────────────────────────────────────────────────

interface RecipeRowProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

function RecipeRow({ recipe, onClick }: RecipeRowProps) {
  return (
    <div
      onClick={() => onClick(recipe)}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
    >
      {/* Spirit emoji */}
      <span className="w-7 text-center text-lg leading-none shrink-0">
        {(recipe.baseSpirit ? SPIRIT_EMOJI[recipe.baseSpirit] : null) ?? "🍹"}
      </span>

      {/* Name + category */}
      <div className="flex flex-1 items-baseline gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {recipe.name}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">| {recipe.category}</span>
      </div>

      {/* Right-side indicators */}
      <div className="flex items-center gap-2 shrink-0">
        {recipe.isMakeable && (
          <span
            className="rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-medium text-teal-300"
            title="You can make this"
          >
            ✓ makeable
          </span>
        )}
        {recipe.isFavorite && (
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
        )}
        <DifficultyDot difficulty={recipe.difficulty} />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface RecipeListProps {
  items: Recipe[];
  onSelect: (recipe: Recipe) => void;
}

export function RecipeList({ items, onSelect }: RecipeListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <span className="text-3xl">🔍</span>
        <p className="mt-2 text-sm">No cocktails match your filters.</p>
      </div>
    );
  }

  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        All Cocktails{" "}
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal normal-case text-muted-foreground">
          {items.length}
        </span>
      </h2>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div className="flex flex-col divide-y divide-border/50">
          {left.map((r) => <RecipeRow key={r.id} recipe={r} onClick={onSelect} />)}
        </div>
        <div className="flex flex-col divide-y divide-border/50">
          {right.map((r) => <RecipeRow key={r.id} recipe={r} onClick={onSelect} />)}
        </div>
      </div>
    </div>
  );
}
