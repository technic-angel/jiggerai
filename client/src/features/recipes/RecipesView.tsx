import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecipeCategorySelector, type RecipeFilters } from "./RecipeCategorySelector";
import { RecipeList } from "./RecipeList";
import { SEED_RECIPES } from "./recipeSeed";
import type { SeedRecipe } from "./recipeSeed";

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

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return SEED_RECIPES.filter((r: SeedRecipe) => {
      if (q) {
        const haystack = r.name.toLowerCase() + " " + r.ingredients.join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.spirits.size > 0 && !filters.spirits.has(r.baseSpirit)) return false;
      if (filters.styles.size > 0 && !filters.styles.has(r.category)) return false;
      if (filters.makeableOnly && !r.isMakeable) return false;
      if (filters.favoritesOnly && !r.isFavorite) return false;
      return true;
    });
  }, [filters]);

  function handleSelect(recipe: SeedRecipe) {
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

      <RecipeList items={filtered} onSelect={handleSelect} />
    </div>
  );
}
