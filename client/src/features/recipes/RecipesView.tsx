import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecipeCategorySelector, type RecipeFilters } from "./RecipeCategorySelector";
import { RecipeList } from "./RecipeList";
import { useRecipes, useMakeableRecipes } from "@/hooks/useRecipes";
import { useFavoriteIds } from "@/hooks/useFavorites";
import type { Recipe } from "@/types";

const DEFAULT_FILTERS: RecipeFilters = {
  query: "",
  spirits: new Set<string>(),
  styles: new Set<string>(),
  makeableOnly: false,
  favoritesOnly: false,
};

export function RecipesView() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);

  const { data: allRecipes = [], isLoading } = useRecipes();
  const { data: makeableRecipes = [] } = useMakeableRecipes();
  const favoriteIds = useFavoriteIds();

  // Build enriched recipe list: merge isMakeable + isFavorite derived fields
  const makeableIds = useMemo(() => new Set(makeableRecipes.map((r) => r.id)), [makeableRecipes]);

  const recipes = useMemo<Recipe[]>(
    () =>
      allRecipes.map((r) => ({
        ...r,
        isMakeable: makeableIds.has(r.id),
        isFavorite: favoriteIds.has(r.id),
      })),
    [allRecipes, makeableIds, favoriteIds]
  );

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return recipes.filter((r: Recipe) => {
      if (q) {
        const haystack = r.name.toLowerCase() + " " + r.ingredients.join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.spirits.size > 0 && !filters.spirits.has(r.baseSpirit ?? "")) return false;
      if (filters.styles.size > 0 && !filters.styles.has(r.category)) return false;
      if (filters.makeableOnly && !r.isMakeable) return false;
      if (filters.favoritesOnly && !r.isFavorite) return false;
      return true;
    });
  }, [filters, recipes]);

  function handleSelect(recipe: Recipe) {
    navigate(`/recipes/${recipe.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Recipes</h1>

      <RecipeCategorySelector
        filters={filters}
        onQueryChange={(query) => setFilters((f) => ({ ...f, query }))}
        onSpiritToggle={(spirit) =>
          setFilters((f) => {
            const next = new Set(f.spirits);
            next.has(spirit) ? next.delete(spirit) : next.add(spirit);
            return { ...f, spirits: next };
          })
        }
        onStyleToggle={(style) =>
          setFilters((f) => {
            const next = new Set(f.styles);
            next.has(style) ? next.delete(style) : next.add(style);
            return { ...f, styles: next };
          })
        }
        onMakeableToggle={() =>
          setFilters((f) => ({ ...f, makeableOnly: !f.makeableOnly }))
        }
        onFavoritesToggle={() =>
          setFilters((f) => ({ ...f, favoritesOnly: !f.favoritesOnly }))
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <span className="text-sm">Loading recipes…</span>
        </div>
      ) : (
        <RecipeList items={filtered} onSelect={handleSelect} />
      )}
    </div>
  );
}
