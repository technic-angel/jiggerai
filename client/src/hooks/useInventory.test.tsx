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
import { useInventory, useBottle, useAddBottle, usePatchBottle, useDeleteBottle } from './useInventory';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useInventory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches inventory list', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce([{ id: 1, spiritName: 'Hendricks' }]);
    const { result } = renderHook(() => useInventory(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1, spiritName: 'Hendricks' }]));
    expect(apiGet).toHaveBeenCalledWith('/inventory/dev-user-001');
  });
});

describe('useBottle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches single bottle', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ id: 5, spiritName: 'Test' });
    const { result } = renderHook(() => useBottle(5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual({ id: 5, spiritName: 'Test' }));
    expect(apiGet).toHaveBeenCalledWith('/inventory/item/5');
  });

  it('does not fetch when id <= 0', () => {
    vi.mocked(apiGet).mockResolvedValueOnce(null);
    renderHook(() => useBottle(0), { wrapper: createWrapper() });
    expect(apiGet).not.toHaveBeenCalled();
  });
});

describe('useAddBottle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls apiPost with payload', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ id: 10 });
    vi.mocked(apiGet).mockResolvedValue([]); // for invalidation
    const { result } = renderHook(() => useAddBottle(), { wrapper: createWrapper() });
    result.current.mutate({ spiritName: 'Test', category: 'Gin' });
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/inventory', {
        spiritName: 'Test',
        category: 'Gin',
        userId: 'dev-user-001',
      })
    );
  });
});

describe('usePatchBottle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls apiPatch with payload', async () => {
    vi.mocked(apiPatch).mockResolvedValueOnce({ id: 5, volumeEighths: 4 });
    vi.mocked(apiGet).mockResolvedValue([]); // for invalidation
    const { result } = renderHook(() => usePatchBottle(5), { wrapper: createWrapper() });
    result.current.mutate({ volumeEighths: 4 });
    await waitFor(() => expect(apiPatch).toHaveBeenCalledWith('/inventory/5', { volumeEighths: 4 }));
  });
});

describe('useDeleteBottle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls apiDelete', async () => {
    vi.mocked(apiDelete).mockResolvedValueOnce(undefined);
    vi.mocked(apiGet).mockResolvedValue([]); // for invalidation
    const { result } = renderHook(() => useDeleteBottle(), { wrapper: createWrapper() });
    result.current.mutate(5);
    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/inventory/5'));
  });
});
