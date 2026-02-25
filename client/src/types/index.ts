// ─── Inventory ───────────────────────────────────────
export interface Bottle {
  id: number;
  userId: string;
  spiritName: string;
  category: string;
  volumeEighths: number; // 0‑8
  purchasePrice: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
  unopenedCount: number;
  updatedAt: string;
}

// ─── Recipes ─────────────────────────────────────────
export interface Recipe {
  id: number;
  name: string;
  category: string;
  ingredients: string[];
  instructions: string;
  youtubeUrl: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
}

export interface RecipeStep {
  id: number;
  recipeId: number;
  variantId: number | null;
  position: number;
  stepText: string;
  durationSeconds: number | null;
  toolRequired: string | null;
}

// ─── Chat ────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  agentName?: string;
}

// ─── Layout ──────────────────────────────────────────
export type ActiveView = "home" | "my-bar" | "recipes" | "profile";
