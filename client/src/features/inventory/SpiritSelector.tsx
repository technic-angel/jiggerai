import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Category definitions ────────────────────────────────────────────────────

export type CategoryGroup = "spirit" | "ingredient";

interface CategoryTile {
  label: string;
  emoji: string;
  group: CategoryGroup;
}

export const SPIRIT_TILES: CategoryTile[] = [
  { label: "Whiskey",  emoji: "🥃", group: "spirit" },
  { label: "Gin",      emoji: "🍸", group: "spirit" },
  { label: "Tequila",  emoji: "🌵", group: "spirit" },
  { label: "Rum",      emoji: "🍹", group: "spirit" },
  { label: "Vodka",    emoji: "🧊", group: "spirit" },
  { label: "Brandy",   emoji: "🍷", group: "spirit" },
  { label: "Mezcal",   emoji: "🌿", group: "spirit" },
  { label: "Scotch",   emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "spirit" },
  { label: "Bourbon",  emoji: "🪵", group: "spirit" },
  { label: "Liqueur",  emoji: "🫙", group: "spirit" },
  { label: "Beer",     emoji: "🍺", group: "spirit" },
  { label: "Wine",     emoji: "🍾", group: "spirit" },
];

export const INGREDIENT_TILES: CategoryTile[] = [
  { label: "Lime Juice",    emoji: "🍋‍🟩", group: "ingredient" },
  { label: "Lemon Juice",   emoji: "🍋",   group: "ingredient" },
  { label: "Simple Syrup",  emoji: "🍯",   group: "ingredient" },
  { label: "Bitters",       emoji: "💧",   group: "ingredient" },
  { label: "Vermouth",      emoji: "🍾",   group: "ingredient" },
  { label: "Soda Water",    emoji: "🫧",   group: "ingredient" },
  { label: "Mint",          emoji: "🌱",   group: "ingredient" },
  { label: "Orange Peel",   emoji: "🍊",   group: "ingredient" },
  { label: "Cherry",        emoji: "🍒",   group: "ingredient" },
  { label: "Other",         emoji: "✨",   group: "ingredient" },
];

// ─── Sub-component: single tile ─────────────────────────────────────────────

interface TileProps {
  tile: CategoryTile;
  selected: boolean;
  onToggle: (label: string) => void;
}

function CategoryTileButton({ tile, selected, onToggle }: TileProps) {
  return (
    <button
      onClick={() => onToggle(tile.label)}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 transition-all",
        "min-w-[80px] cursor-pointer select-none",
        selected
          ? "border-teal-400 bg-teal-400/10 text-teal-300 shadow-[0_0_0_1px_rgba(45,212,191,0.3)]"
          : "border-border bg-card text-muted-foreground hover:border-teal-400/40 hover:text-foreground"
      )}
      aria-pressed={selected}
    >
      <span className="text-2xl leading-none">{tile.emoji}</span>
      <span className="text-xs font-medium leading-tight">{tile.label}</span>
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface SpiritSelectorProps {
  query: string;
  onQueryChange: (q: string) => void;
  selected: Set<string>;
  onToggle: (label: string) => void;
}

export function SpiritSelector({
  query,
  onQueryChange,
  selected,
  onToggle,
}: SpiritSelectorProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search spirits or ingredients…"
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
        />
      </div>

      {/* Spirit tiles */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Select Spirits
        </h2>
        <div className="flex flex-wrap gap-2">
          {SPIRIT_TILES.map((tile) => (
            <CategoryTileButton
              key={tile.label}
              tile={tile}
              selected={selected.has(tile.label)}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>

      {/* Ingredient tiles */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Select Ingredients
        </h2>
        <div className="flex flex-wrap gap-2">
          {INGREDIENT_TILES.map((tile) => (
            <CategoryTileButton
              key={tile.label}
              tile={tile}
              selected={selected.has(tile.label)}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
