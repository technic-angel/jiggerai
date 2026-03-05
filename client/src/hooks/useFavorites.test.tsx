import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the api module
vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  DEV_USER_ID: 'dev-user-001',
}));

import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useFavorites, useFavoriteIds, useToggleFavorite } from './useFavorites';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useFavorites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns favorites data', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([{ id: 1, name: 'Old Fashioned' }]);
    const { result } = renderHook(() => useFavorites(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1, name: 'Old Fashioned' }]));
  });

  it('calls API with correct path', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([]);
    renderHook(() => useFavorites(), { wrapper: createWrapper() });
    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/users/dev-user-001/favorites'));
  });
});

describe('useFavoriteIds', () => {
  it('returns a Set of favorite IDs', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([{ id: 1 }, { id: 5 }, { id: 10 }]);
    const { result } = renderHook(() => useFavoriteIds(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.has(1)).toBe(true);
      expect(result.current.has(5)).toBe(true);
      expect(result.current.has(99)).toBe(false);
    });
  });
});

describe('useToggleFavorite', () => {
  it('calls apiDelete when already favorited', async () => {
    vi.mocked(apiDelete).mockResolvedValueOnce(undefined);
    vi.mocked(apiGet).mockResolvedValue([]); // for query invalidation
    const { result } = renderHook(() => useToggleFavorite(), { wrapper: createWrapper() });
    result.current.mutate({ recipeId: 1, isFavorite: true });
    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/favorites', { userId: 'dev-user-001', recipeId: 1 }));
  });

  it('calls apiPost when not a favorite', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce(undefined);
    vi.mocked(apiGet).mockResolvedValue([]); // for query invalidation
    const { result } = renderHook(() => useToggleFavorite(), { wrapper: createWrapper() });
    result.current.mutate({ recipeId: 2, isFavorite: false });
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/favorites', { userId: 'dev-user-001', recipeId: 2 }));
  });
});
