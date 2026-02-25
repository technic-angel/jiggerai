import { useMemo, useState } from "react";
import { SpiritSelector } from "./SpiritSelector";
import { InventoryList } from "./InventoryList";
import { useInventory } from "@/hooks/useInventory";
import type { Bottle } from "@/types";

// ─── Filter helpers ──────────────────────────────────────────────────────────

// Map tile label → matching category values in the seed data
const TILE_TO_CATEGORIES: Record<string, string[]> = {
  Whiskey:        ["Whiskey"],
  Bourbon:        ["Bourbon"],
  Scotch:         ["Scotch"],
  Gin:            ["Gin"],
  Tequila:        ["Tequila"],
  Rum:            ["Rum"],
  Vodka:          ["Vodka"],
  Brandy:         ["Brandy"],
  Mezcal:         ["Mezcal"],
  Liqueur:        ["Liqueur"],
  Beer:           ["Beer"],
  Wine:           ["Wine"],
  "Lime Juice":   ["Lime Juice"],
  "Lemon Juice":  ["Lemon Juice"],
  "Simple Syrup": ["Simple Syrup"],
  Bitters:        ["Bitters"],
  Vermouth:       ["Vermouth"],
  "Soda Water":   ["Soda Water"],
  Mint:           ["Mint"],
  "Orange Peel":  ["Orange Peel"],
  Cherry:         ["Fruit"],
  Other:          ["Other"],
};

function filterItems(
  items: Bottle[],
  query: string,
  selected: Set<string>
): Bottle[] {
  let result = items;

  if (selected.size > 0) {
    const allowedCategories = new Set<string>();
    selected.forEach((tile) => {
      (TILE_TO_CATEGORIES[tile] ?? [tile]).forEach((c) =>
        allowedCategories.add(c)
      );
    });
    result = result.filter((b) => allowedCategories.has(b.category));
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter(
      (b) =>
        b.spiritName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }

  return result;
}

// ─── View ────────────────────────────────────────────────────────────────────

export function InventoryView() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: inventory = [], isLoading, isError } = useInventory();

  function handleToggle(label: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const filtered = useMemo(
    () => filterItems(inventory, query, selected),
    [inventory, query, selected]
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-foreground">My Home Bar</h1>

      {/* Top half — search + tile filters */}
      <SpiritSelector
        query={query}
        onQueryChange={setQuery}
        selected={selected}
        onToggle={handleToggle}
      />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Bottom half — filtered list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <span className="text-sm">Loading your bar…</span>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-12 text-destructive">
          <span className="text-sm">Failed to load inventory. Is the server running?</span>
        </div>
      ) : (
        <InventoryList items={filtered} />
      )}
    </div>
  );
}
