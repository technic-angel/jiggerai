import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, DEV_USER_ID } from '@/lib/api';
import type { Recipe, FullRecipe } from '@/types';

// ─── Query keys ──────────────────────────────────────
export const recipeKeys = {
  all: ['recipes'] as const,
  makeable: (userId: string) => ['recipes', 'makeable', userId] as const,
  detail: (id: number) => ['recipes', id] as const,
  full: (id: number) => ['recipes', id, 'full'] as const,
};

// ─── Queries ─────────────────────────────────────────

/** All recipes in the global library */
export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.all,
    queryFn: () => apiGet<Recipe[]>('/recipes'),
  });
}

/** Recipes the current user can make with their current inventory */
export function useMakeableRecipes() {
  return useQuery({
    queryKey: recipeKeys.makeable(DEV_USER_ID),
    queryFn: () => apiGet<Recipe[]>(`/recipes/makeable/${DEV_USER_ID}`),
  });
}

/** Single recipe (lightweight — no steps/variants) */
export function useRecipe(id: number) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => apiGet<Recipe>(`/recipes/${id}`),
    enabled: id > 0,
  });
}

/** Full recipe with steps and variants */
export function useFullRecipe(id: number) {
  return useQuery({
    queryKey: recipeKeys.full(id),
    queryFn: () => apiGet<FullRecipe>(`/recipes/${id}/full`),
    enabled: id > 0,
  });
}

// ─── Mutations ───────────────────────────────────────

export interface AddRecipePayload {
  name: string;
  category: string;
  ingredients: string[];
  instructions: string;
  youtubeUrl?: string | null;
  imageUrl?: string | null;
  baseSpirit?: string | null;
  abv?: string | null;
  glassType?: string | null;
  difficulty?: string | null;
  imageEmoji?: string | null;
}

/** Add a new recipe to the global library */
export function useAddRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddRecipePayload) => apiPost<Recipe>('/recipes', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: recipeKeys.all }),
  });
}

/** Delete a recipe from the global library */
export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/recipes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: recipeKeys.all }),
  });
}

export interface PatchRecipePayload {
  rating?: number | null;
}

/** Partially update a recipe (e.g. set/clear star rating) */
export function usePatchRecipe(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatchRecipePayload) => apiPatch<Recipe>(`/recipes/${id}`, payload),
    onSuccess: (updated) => {
      qc.setQueryData(recipeKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: recipeKeys.all });
    },
  });
}
