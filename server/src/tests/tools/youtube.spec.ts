/**
 * Tests for agents/tools/youtube.ts — YouTube Data API search tool.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the ai SDK's tool() to pass-through config
vi.mock('ai', () => ({
  tool: vi.fn((config: any) => config),
}));

import { findYouTubeVideo } from '../../agents/tools/youtube.js';

// Cast to access `execute` directly since vi.mock makes tool() a pass-through
const execute = findYouTubeVideo.execute as (args: { cocktailName: string }) => Promise<any>;

describe('findYouTubeVideo', () => {
  const origEnv = process.env.YOUTUBE_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.YOUTUBE_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (origEnv !== undefined) process.env.YOUTUBE_API_KEY = origEnv;
    else delete process.env.YOUTUBE_API_KEY;
  });

  it('returns found: false when no API key is set', async () => {
    delete process.env.YOUTUBE_API_KEY;
    const result = await execute({ cocktailName: 'Mojito' });
    expect(result).toEqual({ found: false });
  });

  it('returns video data on success', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [{
          id: { videoId: 'dQw4w9WgXcQ' },
          snippet: {
            title: 'How to make a Mojito',
            thumbnails: { medium: { url: 'https://thumb.jpg' } },
          },
        }],
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as any);

    const result = await execute({ cocktailName: 'Mojito' });
    expect(result).toEqual({
      found: true,
      videoId: 'dQw4w9WgXcQ',
      title: 'How to make a Mojito',
      thumbnail: 'https://thumb.jpg',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('falls back to default thumbnail when medium is missing', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        items: [{
          id: { videoId: 'xB2z_4w9WaZ' },
          snippet: {
            title: 'Cocktail',
            thumbnails: { default: { url: 'https://default.jpg' } },
          },
        }],
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as any);

    const result = await execute({ cocktailName: 'Cocktail' });
    expect(result.thumbnail).toBe('https://default.jpg');
  });

  it('returns found: false when API returns error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Forbidden' } }),
    } as any);

    const result = await execute({ cocktailName: 'Negroni' });
    expect(result).toEqual({ found: false });
  });

  it('returns found: false when no items', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as any);

    const result = await execute({ cocktailName: 'Obscure Cocktail' });
    expect(result).toEqual({ found: false });
  });

  it('returns found: false when items is null/undefined', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as any);

    const result = await execute({ cocktailName: 'Test' });
    expect(result).toEqual({ found: false });
  });

  it('returns found: false on fetch error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await execute({ cocktailName: 'Manhattan' });
    expect(result).toEqual({ found: false });
  });
});
