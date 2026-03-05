import { create } from "zustand";
import type { WhereToBuyResult } from "@/types";

// ─── Page context ─────────────────────────────────────────────────────────────
// Tracks what the user is currently looking at so the chat agent has passive
// awareness without the user having to explain it.  Set by each view on mount.
export type PageContextType = "spirit" | "recipe" | "home" | "recipes" | "profile" | null;

export interface PageContext {
  type: PageContextType;
  id: number | null;
  name: string | null;
  /** A short plain-text blurb the agent can use as inline context */
  summary: string | null;
}

interface UIState {
  // Chat panel visibility — defaults to open so `/` shows it immediately
  isChatOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;

  // What the user is currently viewing — read by ChatPanel before each send
  pageContext: PageContext;
  setPageContext: (ctx: PageContext) => void;
  clearPageContext: () => void;

  // A message queued from any page to be auto-sent as soon as the chat panel is ready.
  // ChatPanel watches this, sends it, then clears it.
  pendingChatMessage: string | null;
  /** Open the chat panel and queue a message to be sent automatically. */
  openChatWithMessage: (msg: string) => void;
  clearPendingChatMessage: () => void;

  // AI-fetched YouTube video IDs for recipes that didn't have one.
  // When backfillRecipeYouTube fires, the videoId is stored here keyed by recipeId
  // so RecipeDetailView shows the embed without waiting for a DB refetch.
  recipeYouTubeOverrides: Record<number, string>;
  setRecipeYouTubeOverride: (recipeId: number, videoId: string) => void;

  // AI-fetched "Where to Buy" results keyed by lowercased ingredient/spirit name.
  // Set by useChatStream when a `where_to_buy` SSE event arrives.
  whereToBuyResults: Record<string, { bottleId: number | null; results: WhereToBuyResult[] }>;
  setWhereToBuyResults: (ingredientName: string, bottleId: number | null, results: WhereToBuyResult[]) => void;
  getWhereToBuyResults: (ingredientName: string, bottleId?: number | null) => WhereToBuyResult[] | null;

  // placeholder user id — will come from auth later
  userId: string;
}

const NULL_CONTEXT: PageContext = { type: null, id: null, name: null, summary: null };

export const useUIStore = create<UIState>((set) => ({
  // Chat is open by default — visible immediately on the `/` route
  isChatOpen: true,
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  pageContext: NULL_CONTEXT,
  setPageContext: (ctx) => set({ pageContext: ctx }),
  clearPageContext: () => set({ pageContext: NULL_CONTEXT }),

  pendingChatMessage: null,
  openChatWithMessage: (msg) => set({ isChatOpen: true, pendingChatMessage: msg }),
  clearPendingChatMessage: () => set({ pendingChatMessage: null }),

  recipeYouTubeOverrides: {},
  setRecipeYouTubeOverride: (recipeId, videoId) =>
    set((s) => ({ recipeYouTubeOverrides: { ...s.recipeYouTubeOverrides, [recipeId]: videoId } })),

  whereToBuyResults: {},
  setWhereToBuyResults: (ingredientName, bottleId, results) =>
    set((s) => ({
      whereToBuyResults: {
        ...s.whereToBuyResults,
        [ingredientName.toLowerCase()]: { bottleId, results },
      },
    })),
  getWhereToBuyResults: () => null, // Placeholder — components subscribe to whereToBuyResults directly

  userId: "user_placeholder",
}));
