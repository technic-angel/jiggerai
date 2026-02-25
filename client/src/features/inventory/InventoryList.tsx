import { useNavigate } from "react-router-dom";
import type { Bottle } from "@/types";

// ─── Category → display emoji map ───────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  Whiskey:      "🥃",
  Bourbon:      "🪵",
  Scotch:       "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Gin:          "🍸",
  Tequila:      "🌵",
  Rum:          "🍹",
  Vodka:        "🧊",
  Brandy:       "🍷",
  Mezcal:       "🌿",
  Liqueur:      "🍾",
  "Lime Juice": "🍋‍🟩",
  "Lemon Juice":"🍋",
  "Simple Syrup":"🍯",
  Bitters:      "💧",
  Vermouth:     "🍾",
  "Soda Water": "🫧",
  Fruit:        "🍒",
  Mint:         "🌱",
};

function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "🍶";
}

// ─── Volume dot ─────────────────────────────────────────────────────────────

function VolumeDot({ eighths }: { eighths: number }) {
  const pct = Math.round((eighths / 8) * 100);
  const color =
    pct >= 75 ? "bg-teal-400" :
    pct >= 40 ? "bg-amber-400" :
    pct > 0   ? "bg-red-400"  :
                "bg-muted";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${color} shrink-0`}
      title={`${pct}% remaining`}
    />
  );
}

// ─── Row ────────────────────────────────────────────────────────────────────

interface RowProps {
  bottle: Bottle;
}

function InventoryRow({ bottle }: RowProps) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/my-bar/${bottle.id}`)}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
    >
      {/* Category emoji */}
      <span className="w-7 text-center text-lg leading-none shrink-0">
        {categoryEmoji(bottle.category)}
      </span>

      {/* Name + category */}
      <div className="flex flex-1 items-baseline gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {bottle.spiritName}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          | {bottle.category}
        </span>
      </div>

      {/* Volume indicator */}
      <VolumeDot eighths={bottle.volumeEighths} />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface InventoryListProps {
  items: Bottle[];
}

export function InventoryList({ items }: InventoryListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <span className="text-3xl">🔍</span>
        <p className="mt-2 text-sm">No items match your selection.</p>
      </div>
    );
  }

  // Render in two equal columns to match the mockup layout
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        All Selections{" "}
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal normal-case text-muted-foreground">
          {items.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div className="flex flex-col divide-y divide-border/50">
          {left.map((b) => (
            <InventoryRow key={b.id} bottle={b} />
          ))}
        </div>
        <div className="flex flex-col divide-y divide-border/50">
          {right.map((b) => (
            <InventoryRow key={b.id} bottle={b} />
          ))}
        </div>
      </div>
    </div>
  );
}
