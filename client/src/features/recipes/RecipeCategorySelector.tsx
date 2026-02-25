import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RECIPE_BASE_SPIRITS,
  RECIPE_CATEGORIES,
  SPIRIT_EMOJI,
  STYLE_EMOJI,
} from "./recipeSeed";

// ─── Single tile ─────────────────────────────────────────────────────────────

interface TileProps {
  label: string;
  emoji: string;
  selected: boolean;
  onToggle: (label: string) => void;
}

function FilterTile({ label, emoji, selected, onToggle }: TileProps) {
  return (
    <button
      onClick={() => onToggle(label)}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 transition-all",
        "min-w-[80px] cursor-pointer select-none",
        selected
          ? "border-teal-400 bg-teal-400/10 text-teal-300 shadow-[0_0_0_1px_rgba(45,212,191,0.3)]"
          : "border-border bg-card text-muted-foreground hover:border-teal-400/40 hover:text-foreground"
      )}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface RecipeFilters {
  query: string;
  spirits: Set<string>;
  styles: Set<string>;
  makeableOnly: boolean;
  favoritesOnly: boolean;
}

interface RecipeCategorySelectorProps {
  filters: RecipeFilters;
  onQueryChange: (q: string) => void;
  onSpiritToggle: (label: string) => void;
  onStyleToggle: (label: string) => void;
  onMakeableToggle: () => void;
  onFavoritesToggle: () => void;
}

export function RecipeCategorySelector({
  filters,
  onQueryChange,
  onSpiritToggle,
  onStyleToggle,
  onMakeableToggle,
  onFavoritesToggle,
}: RecipeCategorySelectorProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search cocktails or ingredients…"
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
        />
      </div>

      {/* Base spirit tiles */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          By Spirit
        </h2>
        <div className="flex flex-wrap gap-2">
          {RECIPE_BASE_SPIRITS.map((spirit) => (
            <FilterTile
              key={spirit}
              label={spirit}
              emoji={SPIRIT_EMOJI[spirit] ?? "🍶"}
              selected={filters.spirits.has(spirit)}
              onToggle={onSpiritToggle}
            />
          ))}
        </div>
      </div>

      {/* Style + Makeable row */}
      <div className="flex flex-wrap items-end gap-8">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Style
          </h2>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.map((style) => (
              <FilterTile
                key={style}
                label={style}
                emoji={STYLE_EMOJI[style] ?? "🍹"}
                selected={filters.styles.has(style)}
                onToggle={onStyleToggle}
              />
            ))}
          </div>
        </div>

        {/* Makeable toggle */}
        <button
          onClick={onMakeableToggle}
          aria-pressed={filters.makeableOnly}
          className={cn(
            "mb-0.5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
            filters.makeableOnly
              ? "border-teal-400 bg-teal-400/10 text-teal-300"
              : "border-border bg-card text-muted-foreground hover:border-teal-400/40 hover:text-foreground"
          )}
        >
          <span className="text-xl">✅</span>
          I can make this
        </button>

        {/* Favorites toggle */}
        <button
          onClick={onFavoritesToggle}
          aria-pressed={filters.favoritesOnly}
          className={cn(
            "mb-0.5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
            filters.favoritesOnly
              ? "border-rose-400 bg-rose-400/10 text-rose-300"
              : "border-border bg-card text-muted-foreground hover:border-rose-400/40 hover:text-foreground"
          )}
        >
          <span className="text-xl">❤️</span>
          Favorites
        </button>
      </div>
    </div>
  );
}
