import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/features/layout/AppShell";
import { RecipesView } from "@/features/recipes/RecipesView";
import { RecipeDetailView } from "@/features/recipes/RecipeDetailView";
import { AddRecipeView } from "@/features/recipes/AddRecipeView";
import { InventoryView } from "@/features/inventory/InventoryView";
import { SpiritDetailView } from "@/features/inventory/SpiritDetailView";
import { AddBottleView } from "@/features/inventory/AddBottleView";
import { ProfileView } from "@/features/profile/ProfileView";
import { HomeView } from "@/features/home/HomeView";
import { SuggestionsView } from "@/features/suggestions/SuggestionsView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* AppShell is the persistent layout — sidebar + main area + chat panel */}
            <Route element={<AppShell />}>
              <Route index element={<HomeView />} />
              <Route path="home" element={<HomeView />} />
              <Route path="recipes" element={<RecipesView />} />
              <Route path="recipes/add" element={<AddRecipeView />} />
              <Route path="recipes/:id" element={<RecipeDetailView />} />
              <Route path="my-bar" element={<InventoryView />} />
              <Route path="my-bar/add" element={<AddBottleView />} />
              <Route path="my-bar/:id" element={<SpiritDetailView />} />
              <Route path="profile" element={<ProfileView />} />
              <Route path="suggestions" element={<SuggestionsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
