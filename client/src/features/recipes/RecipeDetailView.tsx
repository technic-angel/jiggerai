import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";
import { SPIRIT_EMOJI } from "./recipeSeed";
import { useRecipe, useMakeableRecipes, useDeleteRecipe, usePatchRecipe } from "@/hooks/useRecipes";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { StarRating } from "@/components/ui/StarRating";

// ─── Recipe variant tile ──────────────────────────────────────────────────────

interface Variant {
  name: string;
  note: string;
  emoji: string;
}

function getVariants(id: number): Variant[] {
  const map: Record<number, Variant[]> = {
    7: [ // Old Fashioned
      { name: "Smoked Old Fashioned", note: "Use Mezcal", emoji: "🌿" },
      { name: "Maple & Bacon", note: "Substitute syrup", emoji: "🍁" },
      { name: "Switch to Rye", note: "Spicier profile", emoji: "🌾" },
    ],
    1: [ // Gin & Tonic
      { name: "Hendrick's G&T", note: "Add cucumber", emoji: "🥒" },
      { name: "Spiced G&T", note: "Add cardamom", emoji: "🫚" },
    ],
    2: [ // Negroni
      { name: "White Negroni", note: "Suze + Lillet", emoji: "🤍" },
      { name: "Mezcal Negroni", note: "Smoky twist", emoji: "🌿" },
    ],
    13: [ // Margarita
      { name: "Spicy Margarita", note: "Add jalapeño", emoji: "🌶️" },
      { name: "Frozen Margarita", note: "Blend with ice", emoji: "🧊" },
      { name: "Mezcal Rita", note: "Swap to mezcal", emoji: "🌿" },
    ],
    8: [ // Manhattan
      { name: "Black Manhattan", note: "Use Averna", emoji: "⚫" },
      { name: "Perfect Manhattan", note: "Split vermouth", emoji: "⚖️" },
    ],
    17: [ // Daiquiri
      { name: "Frozen Daiquiri", note: "Blend with ice", emoji: "🧊" },
      { name: "Banana Daiquiri", note: "Add banana", emoji: "🍌" },
    ],
  };
  return map[id] ?? [];
}

// ─── Ingredient row ──────────────────────────────────────────────────────────

function IngredientRow({ text, index }: { text: string; index: number }) {
  const colors = ["🥃", "⬜", "🟤", "🟠"];
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-5 text-center text-base">{colors[index % colors.length]}</span>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function RecipeDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setPageContext = useUIStore((s) => s.setPageContext);
  const clearPageContext = useUIStore((s) => s.clearPageContext);

  const recipeId = Number(id);
  const { data: recipe, isLoading, isError } = useRecipe(recipeId);
  const { data: makeableRecipes = [] } = useMakeableRecipes();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const isFavorite = favoriteIds.has(recipeId);
  const isMakeable = useMemo(
    () => makeableRecipes.some((r) => r.id === recipeId),
    [makeableRecipes, recipeId]
  );

  const deleteRecipe = useDeleteRecipe();
  const patchRecipe = usePatchRecipe(recipeId);

  const variants = getVariants(recipeId);
  const instructions = recipe?.instructions.split(/\.\s+/).filter(Boolean) ?? [];

  function handleDelete() {
    if (!confirm(`Delete "${recipe?.name}"? This cannot be undone.`)) return;
    deleteRecipe.mutate(recipeId, { onSuccess: () => navigate('/recipes') });
  }

  useEffect(() => {
    if (!recipe) return;
    setPageContext({
      type: "recipe",
      id: recipeId,
      name: recipe.name,
      summary: `${recipe.name} — ${recipe.category} cocktail using ${recipe.baseSpirit ?? "unknown"}. ABV ~${recipe.abv ?? "?"}. Ingredients: ${recipe.ingredients.join(", ")}.`,
    });
    return () => clearPageContext();
  }, [recipeId, recipe?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <span className="text-sm">Loading recipe…</span>
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <span className="text-4xl">🔍</span>
        <p className="mt-3 text-sm">Recipe not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite.mutate({ recipeId, isFavorite })}
            className={cn(
              "gap-2",
              isFavorite ? "text-rose-400 hover:text-rose-300" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-rose-400")} />
            {isFavorite ? "Favorited" : "Add to Favorites"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleteRecipe.isPending}
            className="text-muted-foreground hover:text-destructive"
            title="Delete cocktail"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-8">
          {/* Emoji / image placeholder */}
          <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl border border-border bg-background/50 text-7xl">
            {(recipe.baseSpirit ? SPIRIT_EMOJI[recipe.baseSpirit] : null) ?? recipe.imageEmoji}
          </div>
          {/* Title block */}
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{recipe.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">The classic {recipe.category.toLowerCase()} cocktail.</p>
            </div>
            {/* Star rating */}
            <div className="flex items-center gap-2">
              <StarRating
                value={recipe.rating ?? null}
                onChange={(r) => patchRecipe.mutate({ rating: r })}
              />
              {recipe.rating && (
                <span className="text-xs text-muted-foreground">{recipe.rating}/5</span>
              )}
            </div>
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {recipe.baseSpirit ?? "—"}
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                ~{recipe.abv ?? "?"} ABV
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {recipe.glassType ?? "—"} glass
              </span>
              {isMakeable && (
                <span className="rounded-full border border-teal-400/40 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-300">
                  ✓ You can make this
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Instructions/Ingredients left, Modifications right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* LEFT column */}
        <div className="flex flex-col gap-6">
          {/* Ingredients */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Ingredients</h2>
            <div className="divide-y divide-border/50">
              {recipe.ingredients.map((ing, i) => (
                <IngredientRow key={i} text={ing} index={i} />
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Instructions</h2>
            <ol className="flex flex-col gap-2">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-300">
                    {i + 1}
                  </span>
                  {step.endsWith(".") ? step : step + "."}
                </li>
              ))}
            </ol>
          </div>

          {/* YouTube placeholder */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="text-base font-semibold text-foreground">
                How to Make the Perfect {recipe.name}
              </h2>
              <span className="text-muted-foreground">⋯</span>
            </div>
            <div className="relative mx-5 mb-5 mt-3 overflow-hidden rounded-xl bg-zinc-900 aspect-video flex items-center justify-center border border-border">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600">
                  <span className="text-white text-xl">▶</span>
                </div>
                <p className="text-xs">Video tutorial coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT column: Modifications & Riffs */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold text-foreground">Modifications &amp; Riffs</h2>

            {variants.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                {variants.map((v) => (
                  <button
                    key={v.name}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-4 text-center transition-all hover:border-teal-400/40 hover:bg-teal-400/5 cursor-pointer"
                  >
                    <span className="text-3xl">{v.emoji}</span>
                    <span className="text-xs font-semibold text-foreground leading-tight">{v.name}</span>
                    <span className="text-xs text-muted-foreground">{v.note}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Ask the AI for custom twist ideas!</p>
            )}

            {/* AI custom twist input */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Ask AI for a custom twist…"
                className="h-9 w-full rounded-lg border border-border bg-background/50 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
              />
            </div>
          </div>

          {/* Quick info card */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Facts</h2>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Style</span>
                <span className="text-foreground font-medium">{recipe.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base spirit</span>
                <span className="text-foreground font-medium">{recipe.baseSpirit ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ABV</span>
                <span className="text-foreground font-medium">{recipe.abv ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Glass</span>
                <span className="text-foreground font-medium">{recipe.glassType ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
