import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, DEV_USER_ID } from '@/lib/api';
import type { User } from '@/types';

// ─── Query key ───────────────────────────────────────
export const userKeys = {
  detail: (id: string) => ['users', id] as const,
};

// ─── Queries ─────────────────────────────────────────

/** Current user's profile */
export function useUser() {
  return useQuery({
    queryKey: userKeys.detail(DEV_USER_ID),
    queryFn: () => apiGet<User>(`/users/${DEV_USER_ID}`),
  });
}

// ─── Mutations ───────────────────────────────────────

export interface PatchUserPayload {
  displayName?: string;
}

/** Update the current user's profile */
export function usePatchUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatchUserPayload) =>
      apiPatch<User>(`/users/${DEV_USER_ID}`, payload),
    onSuccess: (updated) => {
      qc.setQueryData(userKeys.detail(DEV_USER_ID), updated);
    },
  });
}
