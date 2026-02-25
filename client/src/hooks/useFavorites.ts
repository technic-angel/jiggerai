import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete, DEV_USER_ID } from '@/lib/api';
import type { Recipe } from '@/types';
import { recipeKeys } from './useRecipes';

// ─── Query key ───────────────────────────────────────
export const favoriteKeys = {
  all: (userId: string) => ['favorites', userId] as const,
};

// ─── Queries ─────────────────────────────────────────

/** Full recipe objects the user has favorited */
export function useFavorites() {
  return useQuery({
    queryKey: favoriteKeys.all(DEV_USER_ID),
    queryFn: () => apiGet<Recipe[]>(`/users/${DEV_USER_ID}/favorites`),
  });
}

/** Returns a Set<number> of favorited recipe IDs — useful for fast lookups */
export function useFavoriteIds(): Set<number> {
  const { data } = useFavorites();
  return new Set((data ?? []).map((r) => r.id));
}

// ─── Mutations ───────────────────────────────────────

/** Toggle a recipe favorite on or off */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, isFavorite }: { recipeId: number; isFavorite: boolean }) => {
      if (isFavorite) {
        return apiDelete('/favorites', { userId: DEV_USER_ID, recipeId });
      }
      return apiPost('/favorites', { userId: DEV_USER_ID, recipeId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: favoriteKeys.all(DEV_USER_ID) });
      // Also bust any cached full-recipe queries so isFavorite badge updates
      qc.invalidateQueries({ queryKey: recipeKeys.all });
    },
  });
}
