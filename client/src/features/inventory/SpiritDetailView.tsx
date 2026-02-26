import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VolumeBar } from "@/components/ui/volume-bar";
import { useUIStore } from "@/store/uiStore";
import { getSpiritDetail } from "./spiritDetailSeed";
import type { SpiritDetail, WhereToBuy, CommonCocktail } from "./spiritDetailSeed";
import { useBottle, usePatchBottle } from "@/hooks/useInventory";
import { useRecipes } from "@/hooks/useRecipes";
import type { Bottle } from "@/types";
import { StarRating } from "@/components/ui/StarRating";

// ─── Where-to-Buy card ───────────────────────────────────────────────────────

function BuyCard({ store }: { store: WhereToBuy }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{store.logo ?? "🏪"}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{store.store}</p>
            <p className="text-xs text-muted-foreground">{store.deliveryNote}</p>
          </div>
        </div>
        <span className="text-sm font-bold text-teal-400">{store.price}</span>
      </div>
      <Button
        asChild
        className="mt-3 w-full bg-teal-500 text-white hover:bg-teal-600"
        size="sm"
      >
        <a href={store.affiliateUrl} target="_blank" rel="noopener noreferrer">
          <ShoppingCart className="mr-2 h-3.5 w-3.5" />
          Buy Now
          <ExternalLink className="ml-2 h-3 w-3 opacity-70" />
        </a>
      </Button>
    </div>
  );
}

// ─── Attribute tile ──────────────────────────────────────────────────────────

function AttributeTile({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── Cocktail chip ───────────────────────────────────────────────────────────

function CocktailChip({ cocktail, onNavigate }: { cocktail: CommonCocktail; onNavigate?: () => void }) {
  return (
    <div
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground",
        onNavigate && "cursor-pointer hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors"
      )}
    >
      <span className="text-lg">{cocktail.emoji}</span>
      {cocktail.name}
    </div>
  );
}

// ─── FALLBACK when detail seed doesn't cover this bottle ────────────────────

function buildFallbackDetail(id: number, bottle?: Bottle): SpiritDetail {
  return {
    id,
    spiritName: bottle?.spiritName ?? "Unknown Spirit",
    subtitle: bottle?.category ?? "",
    description:
      "Detailed tasting notes and origin information will be available once this spirit has been reviewed by the Mixologist agent. Ask the assistant to describe this spirit for you!",
    category: bottle?.category ?? "Spirit",
    abv: "–",
    origin: "–",
    flavorProfile: "–",
    whereToBuy: [
      {
        store: "Search Online",
        price: "Varies",
        deliveryNote: "Google Shopping, Drizly, Total Wine",
        affiliateUrl: `https://www.google.com/search?q=${encodeURIComponent((bottle?.spiritName ?? "") + " buy online")}`,
        logo: "🔍",
      },
    ],
    commonCocktails: [],
  };
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function SpiritDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setPageContext = useUIStore((s) => s.setPageContext);
  const clearPageContext = useUIStore((s) => s.clearPageContext);

  const bottleId = Number(id);
  const { data: bottle, isLoading: bottleLoading, isError: bottleError } = useBottle(bottleId);
  const { data: recipes = [] } = useRecipes();
  const patchBottle = usePatchBottle(bottleId);

  const detail = getSpiritDetail(bottleId) ?? buildFallbackDetail(bottleId, bottle);

  // ── Volume controls (local optimistic state; persisted via PATCH /api/inventory/:id) ──
  const [volumeEighths, setVolumeEighths] = useState(0);
  const [unopenedCount, setUnopenedCount] = useState(0);

  // Sync local state when bottle data arrives
  useEffect(() => {
    if (bottle) {
      setVolumeEighths(bottle.volumeEighths);
      setUnopenedCount(bottle.unopenedCount);
    }
  }, [bottle?.id, bottle?.volumeEighths, bottle?.unopenedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  function subtract() {
    if (volumeEighths > 0) {
      const next = volumeEighths - 1;
      setVolumeEighths(next);
      patchBottle.mutate({ volumeEighths: next });
    } else if (unopenedCount > 0) {
      const nextCount = unopenedCount - 1;
      setUnopenedCount(nextCount);
      setVolumeEighths(8);
      patchBottle.mutate({ volumeEighths: 8, unopenedCount: nextCount });
    }
  }

  function add() {
    if (volumeEighths < 8) {
      const next = volumeEighths + 1;
      setVolumeEighths(next);
      patchBottle.mutate({ volumeEighths: next });
    }
  }

  function addUnopened() {
    const next = unopenedCount + 1;
    setUnopenedCount(next);
    patchBottle.mutate({ unopenedCount: next });
  }

  function removeCurrentBottle() {
    if (volumeEighths > 0) {
      setVolumeEighths(0);
      patchBottle.mutate({ volumeEighths: 0 });
    } else if (unopenedCount > 0) {
      const next = unopenedCount - 1;
      setUnopenedCount(next);
      patchBottle.mutate({ unopenedCount: next });
    }
  }

  // ── Set page context so chat agent knows what's on screen ──────────────────
  useEffect(() => {
    if (!bottle) return;
    setPageContext({
      type: "spirit",
      id: bottleId,
      name: detail.spiritName,
      summary: `${detail.spiritName} — ${detail.subtitle}. Category: ${detail.category}. ABV: ${detail.abv}. Origin: ${detail.origin}. Flavor: ${detail.flavorProfile}. User currently has ${bottle.volumeEighths}/8 remaining.`,
    });
    return () => clearPageContext();
  }, [bottleId, bottle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (bottleLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (bottleError || !bottle) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <span className="text-4xl">🔍</span>
        <p className="mt-3 text-sm">Spirit not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/my-bar")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Bar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/my-bar")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Bar
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        {/* ── LEFT: Spirit info ── */}
        <div className="flex flex-col gap-8">
          {/* Hero row: bottle visual + name + volume */}
          <div className="flex gap-8">
            {/* Bottle image / emoji placeholder */}
            <div className="flex h-52 w-36 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-6xl">
              {bottle.imageUrl ? (
                <img
                  src={bottle.imageUrl}
                  alt={detail.spiritName}
                  className="h-full w-full rounded-2xl object-contain"
                />
              ) : (
                <span role="img" aria-label={detail.category}>
                  {CATEGORY_EMOJI[detail.category] ?? "🍶"}
                </span>
              )}
            </div>

            {/* Name block */}
            <div className="flex flex-col justify-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{detail.spiritName}</h1>
                <p className="mt-1 text-base text-muted-foreground">{detail.subtitle}</p>
              </div>

              {/* Star rating */}
              <div className="flex items-center gap-2">
                <StarRating
                  value={bottle.rating ?? null}
                  onChange={(r) => patchBottle.mutate({ rating: r })}
                />
                {bottle.rating && (
                  <span className="text-xs text-muted-foreground">{bottle.rating}/5</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {/* Volume label + unopened badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {volumeEighths}/8 Full
                  </span>
                  {unopenedCount > 0 && (
                    <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs text-teal-300">
                      +{unopenedCount} unopened
                    </span>
                  )}
                </div>

                {/* Volume bar */}
                <VolumeBar volumeEighths={volumeEighths} className="w-64" />

                {/* +/- eighths controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={subtract}
                    disabled={volumeEighths === 0 && unopenedCount === 0}
                    title="Pour a measure (−⅛)"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-10 text-center text-xs text-muted-foreground">
                    {volumeEighths}/8
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={add}
                    disabled={volumeEighths >= 8}
                    title="Add a measure (+⅛)"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Bottle-level controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={addUnopened}
                    title="Add a new sealed bottle to inventory"
                  >
                    <Plus className="h-3 w-3" />
                    Add bottle
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={removeCurrentBottle}
                    disabled={volumeEighths === 0 && unopenedCount === 0}
                    title="Remove this bottle (opened or given away)"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove bottle
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
          </div>

          {/* Attributes grid */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-foreground">Spirit Attributes</h2>
            <div className="grid grid-cols-2 gap-3">
              <AttributeTile icon="🏷️" label="Category"      value={detail.category}      />
              <AttributeTile icon="🔥" label="ABV"           value={detail.abv}            />
              <AttributeTile icon="📍" label="Origin"        value={detail.origin}         />
              <AttributeTile icon="👅" label="Flavor Profile" value={detail.flavorProfile} />
            </div>
          </div>

          {/* Common cocktails */}
          {detail.commonCocktails.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-semibold text-foreground">Common Cocktails</h2>
              <div className="flex flex-wrap gap-2">
                {detail.commonCocktails.map((c) => {
                  const matched = recipes.find(
                    (r) => r.name.toLowerCase() === c.name.toLowerCase()
                  );
                  return (
                    <CocktailChip
                      key={c.name}
                      cocktail={c}
                      onNavigate={matched ? () => navigate(`/recipes/${matched.id}`) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Where to Buy ── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">Where to Buy</h2>
          {detail.whereToBuy.map((store) => (
            <BuyCard key={store.store} store={store} />
          ))}
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Ask the assistant: "Where else can I buy this?"
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Local helpers ───────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  Whiskey: "🥃",
  Bourbon: "🪵",
  Scotch:  "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Gin:     "🍸",
  Tequila: "🌵",
  Rum:     "🍹",
  Vodka:   "🧊",
  Brandy:  "🍷",
  Mezcal:  "🌿",
};
