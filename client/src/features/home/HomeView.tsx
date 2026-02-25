import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPIRIT_EMOJI } from "@/features/recipes/recipeSeed";
import { useRecipes, useMakeableRecipes } from "@/hooks/useRecipes";
import { useFavoriteIds } from "@/hooks/useFavorites";
import type { Recipe } from "@/types";

// ─── Seeded shuffle (deterministic per session) ───────────────────────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildHomeFeed(recipes: Recipe[]): Recipe[] {
  const favorites = recipes.filter((r) => r.isFavorite);
  const nonFavorites = seededShuffle(
    recipes.filter((r) => !r.isFavorite),
    Date.now() & 0xffff
  );
  // Interleave: 1 favorite every ~3 non-favorites
  const result: Recipe[] = [];
  let fi = 0;
  let ni = 0;
  while (result.length < 24 && (fi < favorites.length || ni < nonFavorites.length)) {
    if (fi < favorites.length && result.length % 4 === 0) {
      result.push(favorites[fi++]);
    } else if (ni < nonFavorites.length) {
      result.push(nonFavorites[ni++]);
    } else if (fi < favorites.length) {
      result.push(favorites[fi++]);
    }
  }
  return result;
}

// ─── Recipe tile ─────────────────────────────────────────────────────────────

function RecipeTile({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-end overflow-hidden rounded-2xl border border-border bg-card",
        "transition-all duration-200 hover:border-teal-400/50 hover:shadow-[0_0_20px_rgba(45,212,191,0.12)]",
        "aspect-[3/4] cursor-pointer text-left w-full"
      )}
    >
      {/* Background emoji / image */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/60">
        <span className="text-7xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-transform duration-300">
          {(recipe.baseSpirit ? SPIRIT_EMOJI[recipe.baseSpirit] : null) ?? recipe.imageEmoji ?? "🍹"}
        </span>
      </div>

      {/* Favorite heart */}
      {recipe.isFavorite && (
        <div className="absolute top-3 right-3 z-10">
          <Heart className="h-4 w-4 fill-rose-400 text-rose-400 drop-shadow" />
        </div>
      )}

      {/* Makeable badge */}
      {recipe.isMakeable && (
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-full bg-teal-500/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            ✓ makeable
          </span>
        </div>
      )}

      {/* Bottom gradient info */}
      <div className="relative z-10 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-8">
        <p className="text-sm font-semibold text-white leading-tight">{recipe.name}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[10px] text-white/60">{recipe.baseSpirit}</span>
          <span className="text-[10px] text-white/40">·</span>
          <span className="text-[10px] text-white/60">{recipe.category}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function HomeView() {
  const navigate = useNavigate();
  const { data: allRecipes = [], isLoading } = useRecipes();
  const { data: makeableRecipes = [] } = useMakeableRecipes();
  const favoriteIds = useFavoriteIds();

  const makeableIds = useMemo(() => new Set(makeableRecipes.map((r) => r.id)), [makeableRecipes]);

  const enriched = useMemo<Recipe[]>(
    () =>
      allRecipes.map((r) => ({
        ...r,
        isMakeable: makeableIds.has(r.id),
        isFavorite: favoriteIds.has(r.id),
      })),
    [allRecipes, makeableIds, favoriteIds]
  );

  const feed = useMemo(() => buildHomeFeed(enriched), [enriched]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good Evening 🍹</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what you can make tonight — plus a few new ideas.
        </p>
      </div>

      {/* Responsive tile grid:
            2 cols  @ < sm
            4 cols  @ sm–lg
            6 cols  @ lg+               */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <span className="text-sm">Loading your feed…</span>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {feed.map((recipe) => (
          <RecipeTile
            key={recipe.id}
            recipe={recipe}
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          />
        ))}
      </div>
      )}
    </div>
  );
}
