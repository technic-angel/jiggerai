// ─── Users ───────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

// ─── Inventory ───────────────────────────────────────
export interface Bottle {
  id: number;
  userId: string;
  spiritName: string;
  category: string;
  volumeEighths: number; // 0‑8
  purchasePrice: string | null;
  imageUrl: string | null;
  isFavorite: number;    // 0 | 1  (DB integer; convert to boolean where needed)
  unopenedCount: number;
  updatedAt: string;
  rating: number | null; // 1-5 stars, null = unrated
}

// ─── Recipes ─────────────────────────────────────────
export interface Recipe {
  id: number;
  name: string;
  category: string;
  baseSpirit: string | null;
  ingredients: string[];
  instructions: string;
  youtubeUrl: string | null;
  imageUrl: string | null;
  abv: string | null;
  glassType: string | null;
  difficulty: string | null;
  imageEmoji: string | null;
  rating: number | null; // 1-5 stars, null = unrated
  /** Derived client-side: true when recipe ID is in the user's favorites list */
  isFavorite?: boolean;
  /** Derived client-side: true when user has all required ingredients */
  isMakeable?: boolean;
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

export interface RecipeVariant {
  id: number;
  baseRecipeId: number;
  variantLabel: string;
  variantNote: string | null;
  ingredients: string[];
  instructions: string | null;
  imageUrl: string | null;
  steps?: RecipeStep[];
}

export interface FullRecipe extends Recipe {
  steps: RecipeStep[];
  variants: RecipeVariant[];
}

// ─── Chat ────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  agentName?: string;
  /** Clickable suggestion chips shown below the message */
  suggestions?: string[];
}

// ─── Layout ──────────────────────────────────────────
export type ActiveView = "home" | "my-bar" | "recipes" | "profile";

