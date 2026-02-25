import { create } from "zustand";

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

  userId: "user_placeholder",
}));
