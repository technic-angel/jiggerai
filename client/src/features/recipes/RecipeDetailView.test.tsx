import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecipeDetailView } from './RecipeDetailView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockRecipe = {
  id: 7,
  name: 'Old Fashioned',
  category: 'Stirred',
  baseSpirit: 'Whiskey',
  ingredients: ['2 oz Bourbon', '2 dashes Bitters', '1 tsp Simple Syrup'],
  instructions: 'Stir ingredients with ice. Strain into rocks glass. Garnish with orange peel.',
  youtubeUrl: null,
  imageUrl: null,
  abv: '32%',
  glassType: 'Rocks',
  difficulty: 'Easy',
  imageEmoji: '🥃',
  rating: 4,
};

const mockDeleteMutate = vi.fn();
const mockPatchMutate = vi.fn();

vi.mock('@/hooks/useRecipes', () => ({
  useRecipe: vi.fn(),
  useMakeableRecipes: vi.fn().mockReturnValue({ data: [] }),
  useDeleteRecipe: () => ({ mutate: mockDeleteMutate, isPending: false }),
  usePatchRecipe: () => ({ mutate: mockPatchMutate, isPending: false }),
}));

const mockToggleFavoriteMutate = vi.fn();
let mockFavoriteIds = new Set<number>();

vi.mock('@/hooks/useFavorites', () => ({
  useFavoriteIds: () => mockFavoriteIds,
  useToggleFavorite: () => ({ mutate: mockToggleFavoriteMutate }),
}));

const mockSetPageContext = vi.fn();
const mockClearPageContext = vi.fn();
const mockOpenChatWithMessage = vi.fn();
vi.mock('@/store/uiStore', () => ({
  useUIStore: (sel: any) => {
    const state = {
      setPageContext: mockSetPageContext,
      clearPageContext: mockClearPageContext,
      openChatWithMessage: mockOpenChatWithMessage,
      recipeYouTubeOverrides: {},
    };
    return sel(state);
  },
}));

import { useRecipe, useMakeableRecipes } from '@/hooks/useRecipes';

function renderWithRoute(id: string = '7') {
  return render(
    <MemoryRouter initialEntries={[`/recipes/${id}`]}>
      <Routes>
        <Route path="/recipes/:id" element={<RecipeDetailView />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RecipeDetailView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockDeleteMutate.mockClear();
    mockPatchMutate.mockClear();
    mockToggleFavoriteMutate.mockClear();
    mockSetPageContext.mockClear();
    mockFavoriteIds = new Set<number>();
    vi.mocked(useMakeableRecipes).mockReturnValue({ data: [] } as any);
  });

  it('shows loading state', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: undefined, isLoading: true, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Loading recipe…')).toBeInTheDocument();
  });

  it('shows not found state', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: undefined, isLoading: false, isError: true } as any);
    renderWithRoute();
    expect(screen.getByText('Recipe not found.')).toBeInTheDocument();
  });

  it('not found Go back navigates', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: undefined, isLoading: false, isError: true } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Go back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('clears page context on unmount', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const { unmount } = renderWithRoute();
    expect(mockSetPageContext).toHaveBeenCalled();
    unmount();
    expect(mockClearPageContext).toHaveBeenCalled();
  });

  it('renders recipe name', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
  });

  it('renders ingredients', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('2 oz Bourbon')).toBeInTheDocument();
    expect(screen.getByText('2 dashes Bitters')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows modifications section with variants for known recipe', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Modifications & Riffs')).toBeInTheDocument();
    // Recipe 7 (Old Fashioned) has variants
    expect(screen.getByText('Smoked Old Fashioned')).toBeInTheDocument();
    expect(screen.getByText('Maple & Bacon')).toBeInTheDocument();
  });

  it('shows quick facts', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Quick Facts')).toBeInTheDocument();
    expect(screen.getByText('Stirred')).toBeInTheDocument();
    expect(screen.getByText('32%')).toBeInTheDocument();
    expect(screen.getByText('Rocks')).toBeInTheDocument();
  });

  it('shows "Add to Favorites" when not favorited', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
  });

  it('shows "Favorited" when recipe is a favorite', () => {
    mockFavoriteIds = new Set([7]);
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Favorited')).toBeInTheDocument();
  });

  it('clicking favorite toggle calls toggleFavorite', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Add to Favorites'));
    expect(mockToggleFavoriteMutate).toHaveBeenCalledWith({ recipeId: 7, isFavorite: false });
  });

  it('shows "You can make this" badge when makeable', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    vi.mocked(useMakeableRecipes).mockReturnValue({ data: [{ id: 7 }] } as any);
    renderWithRoute();
    expect(screen.getByText('✓ You can make this')).toBeInTheDocument();
  });

  it('renders star rating with value', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('renders instructions as numbered steps', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByText(/Stir ingredients with ice/)).toBeInTheDocument();
  });

  it('sets page context on mount', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(mockSetPageContext).toHaveBeenCalled();
  });

  it('shows meta badges (base spirit, ABV, glass)', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getAllByText('Whiskey').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('~32% ABV')).toBeInTheDocument();
    expect(screen.getByText('Rocks glass')).toBeInTheDocument();
  });

  it('shows AI custom twist input', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByPlaceholderText('Ask AI for a custom twist…')).toBeInTheDocument();
  });

  it('shows delete button', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByTitle('Delete cocktail')).toBeInTheDocument();
  });

  it('clicking a variant tile calls openChatWithMessage', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Smoked Old Fashioned'));
    expect(mockOpenChatWithMessage).toHaveBeenCalledWith(expect.stringContaining('Smoked Old Fashioned'));
  });

  it('submitting a custom twist calls openChatWithMessage', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    const input = screen.getByPlaceholderText('Ask AI for a custom twist…');
    await user.type(input, 'make it spicy{Enter}');
    expect(mockOpenChatWithMessage).toHaveBeenCalledWith(expect.stringContaining('make it spicy'));
  });

  it('shows "Find Video" button when no YouTube URL', () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Find Video')).toBeInTheDocument();
  });

  it('clicking "Find Video" calls openChatWithMessage', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Find Video'));
    expect(mockOpenChatWithMessage).toHaveBeenCalledWith(expect.stringContaining('YouTube tutorial'));
  });

  it('renders YouTube embed when recipe has youtubeUrl', () => {
    const recipeWithVideo = { ...mockRecipe, youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    vi.mocked(useRecipe).mockReturnValue({ data: recipeWithVideo, isLoading: false, isError: false } as any);
    const { container } = renderWithRoute();
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.src).toContain('dQw4w9WgXcQ');
  });

  it('renders equipment section when equipment is present', () => {
    const recipeWithEquipment = { ...mockRecipe, equipment: ['🫗 Cocktail Shaker', '🧊 Ice'] };
    vi.mocked(useRecipe).mockReturnValue({ data: recipeWithEquipment, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Equipment Needed')).toBeInTheDocument();
    expect(screen.getByText('🫗 Cocktail Shaker')).toBeInTheDocument();
  });

  it('clicking delete with confirm calls deleteRecipe.mutate', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByTitle('Delete cocktail'));
    expect(mockDeleteMutate).toHaveBeenCalledWith(7, expect.anything());
  });

  it('delete onSuccess navigates to /recipes', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    mockDeleteMutate.mockImplementation((_id: number, opts: any) => opts.onSuccess?.());
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByTitle('Delete cocktail'));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes');
  });

  it('clicking delete without confirm does not call mutate', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByTitle('Delete cocktail'));
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('generates gin variants for a gin recipe', () => {
    const ginRecipe = { ...mockRecipe, id: 999, name: 'Gimlet', baseSpirit: 'Gin' };
    vi.mocked(useRecipe).mockReturnValue({ data: ginRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('999');
    expect(screen.getByText('Gimlet Royale')).toBeInTheDocument();
  });

  it('generates tequila variants for a tequila recipe', () => {
    const tequilaRecipe = { ...mockRecipe, id: 998, name: 'Paloma', baseSpirit: 'Tequila' };
    vi.mocked(useRecipe).mockReturnValue({ data: tequilaRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('998');
    expect(screen.getByText('Spicy Paloma')).toBeInTheDocument();
  });

  it('generates mezcal variants', () => {
    const mezcalRecipe = { ...mockRecipe, id: 997, name: 'Oaxacan', baseSpirit: 'Mezcal' };
    vi.mocked(useRecipe).mockReturnValue({ data: mezcalRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('997');
    expect(screen.getByText('Oaxacan Spritz')).toBeInTheDocument();
  });

  it('generates scotch variants', () => {
    const scotchRecipe = { ...mockRecipe, id: 996, name: 'Rob Roy', baseSpirit: 'Scotch' };
    vi.mocked(useRecipe).mockReturnValue({ data: scotchRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('996');
    expect(screen.getByText('Peaty Rob Roy')).toBeInTheDocument();
  });

  it('generates rum variants', () => {
    const rumRecipe = { ...mockRecipe, id: 995, name: 'Daiquiri', baseSpirit: 'Rum' };
    vi.mocked(useRecipe).mockReturnValue({ data: rumRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('995');
    expect(screen.getByText('Spiced Daiquiri')).toBeInTheDocument();
  });

  it('generates vodka variants', () => {
    const vodkaRecipe = { ...mockRecipe, id: 994, name: 'Cosmopolitan', baseSpirit: 'Vodka' };
    vi.mocked(useRecipe).mockReturnValue({ data: vodkaRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('994');
    expect(screen.getByText('Cosmopolitan Twist')).toBeInTheDocument();
  });

  it('generates whiskey variants for a whiskey recipe', () => {
    const whiskeyRecipe = { ...mockRecipe, id: 991, name: 'Boulevardier', baseSpirit: 'Whiskey' };
    vi.mocked(useRecipe).mockReturnValue({ data: whiskeyRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('991');
    expect(screen.getByText('Smoked Boulevardier')).toBeInTheDocument();
    expect(screen.getByText('Boulevardier Sour')).toBeInTheDocument();
  });

  it('generates generic fallback variants for unknown spirit', () => {
    const unknownRecipe = { ...mockRecipe, id: 993, name: 'Mystery', baseSpirit: 'Absinthe' };
    vi.mocked(useRecipe).mockReturnValue({ data: unknownRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('993');
    expect(screen.getByText('Spicy Mystery')).toBeInTheDocument();
    expect(screen.getByText('Frozen Mystery')).toBeInTheDocument();
  });

  it('generates variants for null baseSpirit', () => {
    const noSpiritRecipe = { ...mockRecipe, id: 992, name: 'Mocktail', baseSpirit: null };
    vi.mocked(useRecipe).mockReturnValue({ data: noSpiritRecipe, isLoading: false, isError: false } as any);
    renderWithRoute('992');
    expect(screen.getByText('Spicy Mocktail')).toBeInTheDocument();
  });

  it('renders recipe with imageUrl', () => {
    const recipeWithImage = { ...mockRecipe, imageUrl: 'http://img.com/cocktail.jpg' };
    vi.mocked(useRecipe).mockReturnValue({ data: recipeWithImage, isLoading: false, isError: false } as any);
    renderWithRoute();
    const img = screen.getByAltText('Old Fashioned');
    expect(img).toHaveAttribute('src', 'http://img.com/cocktail.jpg');
  });

  it('shows variant tiles for recipes with variants', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    // Variants are shown for Old Fashioned (id: 7)
    expect(screen.getByText('Smoked Old Fashioned')).toBeInTheDocument();
    expect(screen.getByText('Maple & Bacon')).toBeInTheDocument();
  });

  it('renders star rating and clicking changes rating', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    // Click rating star
    await user.click(screen.getByLabelText('5 stars'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ rating: 5 });
  });

  it('clicking twist sparkle button calls openChatWithMessage', async () => {
    vi.mocked(useRecipe).mockReturnValue({ data: mockRecipe, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    const input = screen.getByPlaceholderText('Ask AI for a custom twist…');
    await user.type(input, 'add honey');
    // Click the sparkle button (the one next to the input)
    const sparkleButtons = screen.getAllByRole('button').filter(b => !b.hasAttribute('disabled'));
    const lastButton = sparkleButtons[sparkleButtons.length - 1];
    await user.click(lastButton);
    expect(mockOpenChatWithMessage).toHaveBeenCalled();
  });

  it('parses newline-separated instructions', () => {
    const newlineRecipe = { ...mockRecipe, instructions: 'Muddle sugar and bitters\nAdd bourbon and ice\nStir gently\nStrain into glass' };
    vi.mocked(useRecipe).mockReturnValue({ data: newlineRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText(/Muddle sugar and bitters/)).toBeInTheDocument();
    expect(screen.getByText(/Add bourbon and ice/)).toBeInTheDocument();
  });

  it('parses numbered inline instructions', () => {
    const numberedRecipe = { ...mockRecipe, instructions: '1. Muddle sugar and bitters. 2. Add bourbon. 3. Stir with ice.' };
    vi.mocked(useRecipe).mockReturnValue({ data: numberedRecipe, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText(/Muddle sugar and bitters/)).toBeInTheDocument();
    expect(screen.getByText(/Add bourbon/)).toBeInTheDocument();
  });
});
