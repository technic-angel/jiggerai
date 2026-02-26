import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete, DEV_USER_ID } from '@/lib/api';
import type { Bottle } from '@/types';

// ─── Query keys ──────────────────────────────────────
export const inventoryKeys = {
  all: ['inventory', DEV_USER_ID] as const,
  item: (id: number) => ['inventory', DEV_USER_ID, id] as const,
};

// ─── Queries ─────────────────────────────────────────

/** Full inventory list for the current user */
export function useInventory() {
  return useQuery({
    queryKey: inventoryKeys.all,
    queryFn: () => apiGet<Bottle[]>(`/inventory/${DEV_USER_ID}`),
  });
}

/** Single inventory item */
export function useBottle(id: number) {
  return useQuery({
    queryKey: inventoryKeys.item(id),
    queryFn: () => apiGet<Bottle>(`/inventory/item/${id}`),
    enabled: id > 0,
  });
}

// ─── Mutations ───────────────────────────────────────

export interface AddBottlePayload {
  spiritName: string;
  category: string;
  volumeEighths?: number;
  unopenedCount?: number;
  purchasePrice?: number | string | null;
  imageUrl?: string | null;
}

/** Create a new inventory item */
export function useAddBottle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddBottlePayload) =>
      apiPost<Bottle>('/inventory', { ...payload, userId: DEV_USER_ID }),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}

export interface PatchBottlePayload {
  spiritName?: string;
  category?: string;
  volumeEighths?: number;
  volumeDelta?: number;
  unopenedCount?: number;
  unopenedCountDelta?: number;
  openNewBottle?: boolean;
  openVolumeEighths?: number;
  purchasePrice?: number | string | null;
  imageUrl?: string | null;
  isFavorite?: number;
  rating?: number | null;
}

/** Partially update an inventory item (volume, favorite, etc.) */
export function usePatchBottle(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatchBottlePayload) =>
      apiPatch<Bottle>(`/inventory/${id}`, payload),
    onSuccess: (updated) => {
      qc.setQueryData(inventoryKeys.item(id), updated);
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

/** Delete an inventory item */
export function useDeleteBottle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/inventory/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}
