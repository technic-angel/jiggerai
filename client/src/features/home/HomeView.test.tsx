import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HomeView } from './HomeView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: vi.fn(),
  useMakeableRecipes: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('@/hooks/useFavorites', () => ({
  useFavoriteIds: vi.fn().mockReturnValue(new Set<number>()),
}));

import { useRecipes, useMakeableRecipes } from '@/hooks/useRecipes';
import { useFavoriteIds } from '@/hooks/useFavorites';

const baseRecipe = {
  id: 1, name: 'Old Fashioned', category: 'Stirred', baseSpirit: 'Whiskey',
  ingredients: [], instructions: '', youtubeUrl: null, imageUrl: null,
  abv: null, glassType: null, difficulty: null, imageEmoji: '🥃', rating: null,
};

describe('HomeView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.mocked(useMakeableRecipes).mockReturnValue({ data: [] } as any);
    vi.mocked(useFavoriteIds).mockReturnValue(new Set<number>());
  });

  it('renders greeting', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [baseRecipe], isLoading: false } as any);
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    // "Good Evening" or similar time-based greetings
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    expect(screen.getByText('Loading your feed…')).toBeInTheDocument();
  });

  it('renders recipe tiles', () => {
    vi.mocked(useRecipes).mockReturnValue({
      data: [
        baseRecipe,
        { ...baseRecipe, id: 2, name: 'Negroni', baseSpirit: 'Gin', imageEmoji: '🍸' },
      ],
      isLoading: false,
    } as any);
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
    expect(screen.getByText('Negroni')).toBeInTheDocument();
  });

  it('shows description text', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [], isLoading: false } as any);
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    expect(screen.getByText(/what you can make tonight/)).toBeInTheDocument();
  });

  it('clicking a recipe tile navigates to recipe detail', async () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [baseRecipe], isLoading: false } as any);
    const user = userEvent.setup();
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    await user.click(screen.getByText('Old Fashioned'));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes/1');
  });

  it('shows makeable badge when recipe is makeable', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [baseRecipe], isLoading: false } as any);
    vi.mocked(useMakeableRecipes).mockReturnValue({ data: [{ id: 1 }] } as any);
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    expect(screen.getByText('✓ makeable')).toBeInTheDocument();
  });

  it('shows favorite heart when recipe is favorited', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [baseRecipe], isLoading: false } as any);
    vi.mocked(useFavoriteIds).mockReturnValue(new Set([1]));
    const { container } = render(<MemoryRouter><HomeView /></MemoryRouter>);
    // The heart icon should have fill-rose-400 class
    const hearts = container.querySelectorAll('.fill-rose-400');
    expect(hearts.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty recipes gracefully', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [], isLoading: false } as any);
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    // Should render the grid but with no tiles
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows favorite tile when all recipes are favorites and non-favorites exhausted', () => {
    // Provide recipes where all are favorites — forces the else-if branch at line 38
    const favRecipes = Array.from({ length: 8 }, (_, i) => ({
      ...baseRecipe,
      id: i + 1,
      name: `Cocktail ${i + 1}`,
    }));
    vi.mocked(useRecipes).mockReturnValue({ data: favRecipes, isLoading: false } as any);
    // Mark ALL recipes as favorites — no non-favorites available
    vi.mocked(useFavoriteIds).mockReturnValue(new Set(favRecipes.map((r) => r.id)));
    render(<MemoryRouter><HomeView /></MemoryRouter>);
    // All tiles should render since they are all favorites
    expect(screen.getByText('Cocktail 1')).toBeInTheDocument();
    expect(screen.getByText('Cocktail 8')).toBeInTheDocument();
  });
});
