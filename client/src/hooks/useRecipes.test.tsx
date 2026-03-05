import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  DEV_USER_ID: 'dev-user-001',
}));

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useRecipes, useMakeableRecipes, useRecipe, useFullRecipe, useAddRecipe, useDeleteRecipe, usePatchRecipe } from './useRecipes';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useRecipes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all recipes', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([{ id: 1, name: 'Negroni' }]);
    const { result } = renderHook(() => useRecipes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1, name: 'Negroni' }]));
    expect(apiGet).toHaveBeenCalledWith('/recipes');
  });
});

describe('useMakeableRecipes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches makeable recipes', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([{ id: 2 }]);
    const { result } = renderHook(() => useMakeableRecipes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
    expect(apiGet).toHaveBeenCalledWith('/recipes/makeable/dev-user-001');
  });
});

describe('useRecipe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches single recipe', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ id: 3, name: 'Daiquiri' });
    const { result } = renderHook(() => useRecipe(3), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual({ id: 3, name: 'Daiquiri' }));
    expect(apiGet).toHaveBeenCalledWith('/recipes/3');
  });

  it('does not fetch when id <= 0', () => {
    renderHook(() => useRecipe(0), { wrapper: createWrapper() });
    expect(apiGet).not.toHaveBeenCalled();
  });
});

describe('useFullRecipe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches full recipe with steps and variants', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ id: 3, steps: [], variants: [] });
    const { result } = renderHook(() => useFullRecipe(3), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual({ id: 3, steps: [], variants: [] }));
    expect(apiGet).toHaveBeenCalledWith('/recipes/3/full');
  });
});

describe('useAddRecipe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls apiPost with payload', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ id: 10 });
    vi.mocked(apiGet).mockResolvedValue([]);
    const { result } = renderHook(() => useAddRecipe(), { wrapper: createWrapper() });
    result.current.mutate({ name: 'Test', category: 'Stirred', ingredients: ['a'], instructions: 'mix' });
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/recipes', expect.objectContaining({ name: 'Test' })));
  });
});

describe('useDeleteRecipe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls apiDelete', async () => {
    vi.mocked(apiDelete).mockResolvedValueOnce(undefined);
    vi.mocked(apiGet).mockResolvedValue([]);
    const { result } = renderHook(() => useDeleteRecipe(), { wrapper: createWrapper() });
    result.current.mutate(5);
    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/recipes/5'));
  });
});

describe('usePatchRecipe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls apiPatch with rating', async () => {
    vi.mocked(apiPatch).mockResolvedValueOnce({ id: 5, rating: 4 });
    vi.mocked(apiGet).mockResolvedValue([]);
    const { result } = renderHook(() => usePatchRecipe(5), { wrapper: createWrapper() });
    result.current.mutate({ rating: 4 });
    await waitFor(() => expect(apiPatch).toHaveBeenCalledWith('/recipes/5', { rating: 4 }));
  });
});
