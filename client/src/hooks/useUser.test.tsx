import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  DEV_USER_ID: 'dev-user-001',
}));

import { apiGet, apiPatch } from '@/lib/api';
import { useUser, usePatchUser } from './useUser';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches user data', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ id: 'u1', displayName: 'Melissa', email: 'test@example.com', createdAt: '2024-01-01' });
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data).toEqual(expect.objectContaining({ displayName: 'Melissa' })));
    expect(apiGet).toHaveBeenCalledWith('/users/dev-user-001');
  });
});

describe('usePatchUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls apiPatch with payload', async () => {
    vi.mocked(apiPatch).mockResolvedValueOnce({ id: 'u1', displayName: 'Updated' });
    const { result } = renderHook(() => usePatchUser(), { wrapper: createWrapper() });
    result.current.mutate({ displayName: 'Updated' });
    await waitFor(() => expect(apiPatch).toHaveBeenCalledWith('/users/dev-user-001', { displayName: 'Updated' }));
  });
});
