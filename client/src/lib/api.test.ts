import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiGet, apiPost, apiPatch, apiDelete, DEV_USER_ID } from './api';

describe('API client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  describe('DEV_USER_ID', () => {
    it('is defined', () => {
      expect(DEV_USER_ID).toBeDefined();
      expect(typeof DEV_USER_ID).toBe('string');
    });

    it('uses VITE_DEV_USER_ID from environment', () => {
      // test/setup.ts stubs it to 'test-user-001'
      expect(DEV_USER_ID).toBe('test-user-001');
    });
  });

  describe('apiGet', () => {
    it('calls fetch with the correct URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await apiGet('/test');
      expect(mockFetch).toHaveBeenCalledWith('/api/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(apiGet('/missing')).rejects.toThrow('Not found');
    });

    it('throws generic error when response body has no error field', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(apiGet('/fail')).rejects.toThrow('HTTP 500');
    });

    it('throws generic error when json parsing fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('bad json')),
      });

      await expect(apiGet('/fail')).rejects.toThrow('HTTP 500');
    });
  });

  describe('apiPost', () => {
    it('sends POST with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1 }),
      });

      const result = await apiPost('/items', { name: 'Gin' });
      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Gin' }),
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('apiPatch', () => {
    it('sends PATCH with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'Updated' }),
      });

      const result = await apiPatch('/items/1', { name: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      expect(result).toEqual({ id: 1, name: 'Updated' });
    });
  });

  describe('apiDelete', () => {
    it('sends DELETE without body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      await apiDelete('/items/1');
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        method: 'DELETE',
        headers: undefined,
        body: undefined,
      });
    });

    it('sends DELETE with body when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      await apiDelete('/favorites', { userId: 'u1', recipeId: 1 });
      expect(mockFetch).toHaveBeenCalledWith('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u1', recipeId: 1 }),
      });
    });

    it('handles 204 without calling json()', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await apiDelete('/items/1');
      expect(result).toBeUndefined();
    });
  });
});
