// server/src/agents/tools/youtube.ts
//
// YouTube Data API v3 search tool.
// Returns the top video result for a cocktail query so agents can attach
// video cards to their responses.

import { tool } from 'ai';
import { z } from 'zod';

export interface YouTubeResult {
  found: true;
  videoId: string;
  title: string;
  thumbnail: string;
  youtubeUrl: string;
}

export interface YouTubeNotFound {
  found: false;
}

export const findYouTubeVideo = tool({
  description:
    'Search YouTube for a cocktail recipe video. Call this whenever you suggest a specific named cocktail or when the user asks for a video demo.',
  inputSchema: z.object({
    cocktailName: z
      .string()
      .describe('The cocktail name to search for, e.g. "Old Fashioned"'),
  }),
  execute: async ({ cocktailName }): Promise<YouTubeResult | YouTubeNotFound> => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      console.warn('[youtube] YOUTUBE_API_KEY not set — skipping search');
      return { found: false };
    }

    const q = encodeURIComponent(`how to make ${cocktailName} cocktail recipe`);
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${q}&type=video&maxResults=1&key=${key}`;

    try {
      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (!res.ok) {
        console.error('[youtube] API error:', data);
        return { found: false };
      }

      const item = data.items?.[0];
      if (!item) return { found: false };

      return {
        found: true,
        videoId: item.id.videoId as string,
        title: item.snippet.title as string,
        thumbnail: (item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url) as string,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    } catch (err) {
      console.error('[youtube] fetch error:', err);
      return { found: false };
    }
  },
});
