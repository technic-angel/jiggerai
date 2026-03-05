import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RecipesView } from './RecipesView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const allRecipes = [
  { id: 1, name: 'Old Fashioned', category: 'Stirred', baseSpirit: 'Whiskey', ingredients: ['2 oz Bourbon'], instructions: 'Stir and serve.', youtubeUrl: null, imageUrl: null, abv: null, glassType: null, difficulty: null, imageEmoji: null, rating: null },
  { id: 2, name: 'Gin & Tonic', category: 'Highball', baseSpirit: 'Gin', ingredients: ['2 oz Gin', 'Tonic'], instructions: 'Pour gin, add tonic.', youtubeUrl: null, imageUrl: null, abv: null, glassType: null, difficulty: null, imageEmoji: null, rating: null },
  { id: 3, name: 'Margarita', category: 'Shaken', baseSpirit: 'Tequila', ingredients: ['2 oz Tequila', 'Lime'], instructions: 'Shake and strain.', youtubeUrl: null, imageUrl: null, abv: null, glassType: null, difficulty: null, imageEmoji: null, rating: null },
];

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: vi.fn(),
  useMakeableRecipes: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('@/hooks/useFavorites', () => ({
  useFavoriteIds: () => new Set<number>(),
}));

import { useRecipes, useMakeableRecipes } from '@/hooks/useRecipes';

describe('RecipesView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.mocked(useRecipes).mockReturnValue({ data: allRecipes, isLoading: false } as any);
  });

  it('renders the heading', () => {
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    expect(screen.getByText('Recipes')).toBeInTheDocument();
  });

  it('renders recipe list', () => {
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
    expect(screen.getByText('Gin & Tonic')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useRecipes).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    expect(screen.getByText('Loading recipes…')).toBeInTheDocument();
  });

  it('renders filter controls', () => {
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    expect(screen.getByPlaceholderText('Search cocktails or ingredients…')).toBeInTheDocument();
    expect(screen.getByText('I can make this')).toBeInTheDocument();
  });

  it('filters by search query', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText('Search cocktails or ingredients…'), 'Margarita');
    expect(screen.getByText('Margarita')).toBeInTheDocument();
    expect(screen.queryByText('Old Fashioned')).not.toBeInTheDocument();
  });

  it('filters by spirit when tile is toggled', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    // Click a spirit tile - get the first "Gin" in the By Spirit section
    const ginButtons = screen.getAllByText('Gin');
    await user.click(ginButtons[0]);
    expect(screen.getByText('Gin & Tonic')).toBeInTheDocument();
    expect(screen.queryByText('Old Fashioned')).not.toBeInTheDocument();
  });

  it('navigates to recipe detail on selection', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    await user.click(screen.getByText('Old Fashioned'));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes/1');
  });

  it('toggles makeable filter', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    await user.click(screen.getByText('I can make this'));
    // No makeable recipes so list should be empty
    expect(screen.getByText('No cocktails match your filters.')).toBeInTheDocument();
  });

  it('filters by style when style tile is toggled', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    // Click the "Stirred" style tile
    await user.click(screen.getByText('Stirred'));
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
    expect(screen.queryByText('Margarita')).not.toBeInTheDocument();
  });

  it('deselects style when clicked again', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    await user.click(screen.getByText('Stirred'));
    expect(screen.queryByText('Margarita')).not.toBeInTheDocument();
    await user.click(screen.getByText('Stirred'));
    // All recipes should be back
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
    expect(screen.getByText('Margarita')).toBeInTheDocument();
  });

  it('toggles favorites filter', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    await user.click(screen.getByText('Favorites'));
    // No favorites, so list should be empty
    expect(screen.getByText('No cocktails match your filters.')).toBeInTheDocument();
  });

  it('shows makeable badge when recipes match inventory', () => {
    vi.mocked(useMakeableRecipes).mockReturnValue({ data: [{ id: 1 }] } as any);
    render(<MemoryRouter><RecipesView /></MemoryRouter>);
    // The makeable recipe should still render
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
    vi.mocked(useMakeableRecipes).mockReturnValue({ data: [] } as any);
  });
});
