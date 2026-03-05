import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SpiritDetailView } from './SpiritDetailView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockBottle = {
  id: 1,
  userId: 'u1',
  spiritName: 'Hendricks Gin',
  category: 'Gin',
  volumeEighths: 6,
  purchasePrice: '40.00',
  imageUrl: null,
  isFavorite: 0,
  unopenedCount: 1,
  updatedAt: '2024-01-01',
  rating: 4,
};

const mockPatchMutate = vi.fn();

vi.mock('@/hooks/useInventory', () => ({
  useBottle: vi.fn().mockReturnValue({ data: null, isLoading: false, isError: false }),
  usePatchBottle: () => ({ mutate: mockPatchMutate, isPending: false }),
}));

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}));

import { useRecipes } from '@/hooks/useRecipes';

const mockSetPageContext = vi.fn();
const mockClearPageContext = vi.fn();
const mockOpenChatWithMessage = vi.fn();
let mockWhereToBuyResults: Record<string, any> = {};
vi.mock('@/store/uiStore', () => ({
  useUIStore: (sel: any) => {
    const state = {
      setPageContext: mockSetPageContext,
      clearPageContext: mockClearPageContext,
      openChatWithMessage: mockOpenChatWithMessage,
      whereToBuyResults: mockWhereToBuyResults,
    };
    return sel(state);
  },
}));

import { useBottle } from '@/hooks/useInventory';

function renderWithRoute(id: string = '1') {
  return render(
    <MemoryRouter initialEntries={[`/my-bar/${id}`]}>
      <Routes>
        <Route path="/my-bar/:id" element={<SpiritDetailView />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SpiritDetailView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPatchMutate.mockClear();
    mockSetPageContext.mockClear();
    mockClearPageContext.mockClear();
    mockWhereToBuyResults = {};
  });

  it('shows loading state', () => {
    vi.mocked(useBottle).mockReturnValue({ data: undefined, isLoading: true, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows not found state on error', () => {
    vi.mocked(useBottle).mockReturnValue({ data: undefined, isLoading: false, isError: true } as any);
    renderWithRoute();
    expect(screen.getByText('Spirit not found.')).toBeInTheDocument();
  });

  it('shows not found Back to My Bar button navigates', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: undefined, isLoading: false, isError: true } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Back to My Bar'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar');
  });

  it('renders spirit details when data loaded', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Spirit Attributes')).toBeInTheDocument();
  });

  it('renders volume controls', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByTitle('Pour a measure (−⅛)')).toBeInTheDocument();
    expect(screen.getByTitle('Add a measure (+⅛)')).toBeInTheDocument();
  });

  it('renders back button that navigates', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Back to My Bar'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar');
  });

  it('clicking + volume calls patchBottle', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByTitle('Add a measure (+⅛)'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ volumeEighths: 7 });
  });

  it('clicking − volume calls patchBottle', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByTitle('Pour a measure (−⅛)'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ volumeEighths: 5 });
  });

  it('clicking Add bottle calls patchBottle with unopenedCount', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Add bottle'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ unopenedCount: 2 });
  });

  it('clicking Remove bottle calls patchBottle zeroing volume', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Remove bottle'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ volumeEighths: 0 });
  });

  it('displays unopened count badge when > 0', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('+1 unopened')).toBeInTheDocument();
  });

  it('shows Where to Buy section', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Where to Buy')).toBeInTheDocument();
  });

  it('renders star rating', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    // mockBottle has rating 4, so should display 4/5
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('clicking a star calls patchBottle with rating', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByLabelText('5 stars'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ rating: 5 });
  });

  it('renders volume fraction display', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('6/8 Full')).toBeInTheDocument();
  });

  it('sets page context on mount', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(mockSetPageContext).toHaveBeenCalled();
  });

  it('shows fallback detail for unknown spirit', () => {
    const unknownBottle = { ...mockBottle, id: 999 };
    vi.mocked(useBottle).mockReturnValue({ data: unknownBottle, isLoading: false, isError: false } as any);
    renderWithRoute('999');
    expect(screen.getByText('Description')).toBeInTheDocument();
    // Fallback description mentions "Mixologist agent"
    expect(screen.getByText(/Mixologist agent/)).toBeInTheDocument();
  });

  it('renders bottle image when imageUrl is set', () => {
    const bottleWithImg = { ...mockBottle, imageUrl: 'https://example.com/gin.png' };
    vi.mocked(useBottle).mockReturnValue({ data: bottleWithImg, isLoading: false, isError: false } as any);
    renderWithRoute();
    const img = screen.getByAltText("Maker's Mark");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/gin.png');
  });

  it('renders emoji placeholder when no imageUrl', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    // Seed id 1 = Bourbon category → emoji 🪵
    expect(screen.getByRole('img', { name: 'Bourbon' })).toBeInTheDocument();
  });

  it('renders common cocktails section', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Common Cocktails')).toBeInTheDocument();
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
  });

  it('common cocktail chip navigates to matched recipe', async () => {
    vi.mocked(useRecipes).mockReturnValue({ data: [{ id: 42, name: 'Old Fashioned' }], isLoading: false } as any);
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Old Fashioned'));
    expect(mockNavigate).toHaveBeenCalledWith('/recipes/42');
  });

  it('subtract opens new bottle when volume is 0 and unopened > 0', async () => {
    const bottle0 = { ...mockBottle, volumeEighths: 0, unopenedCount: 2 };
    vi.mocked(useBottle).mockReturnValue({ data: bottle0, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByTitle('Pour a measure (−⅛)'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ volumeEighths: 8, unopenedCount: 1 });
  });

  it('removeCurrentBottle removes unopened when volume is 0', async () => {
    const bottle0 = { ...mockBottle, volumeEighths: 0, unopenedCount: 2 };
    vi.mocked(useBottle).mockReturnValue({ data: bottle0, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('Remove bottle'));
    expect(mockPatchMutate).toHaveBeenCalledWith({ unopenedCount: 1 });
  });

  it('renders AI Search button and clicking it opens chat', async () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    const user = userEvent.setup();
    renderWithRoute();
    await user.click(screen.getByText('AI Search'));
    expect(mockOpenChatWithMessage).toHaveBeenCalledWith(
      expect.stringContaining("Where can I buy")
    );
  });

  it('renders AI buy cards when aiResults exist', () => {
    mockWhereToBuyResults = {
      "maker's mark": {
        results: [
          { store: 'TestStore', priceRange: '$25-35', url: 'https://test.com', logo: '🛒', deliveryNote: 'Fast', type: 'online' as const },
        ],
        bottleId: 1,
      },
    };
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('TestStore')).toBeInTheDocument();
    expect(screen.getByText('Buy Now')).toBeInTheDocument();
    expect(screen.getByText(/AI-found retailers/)).toBeInTheDocument();
    // AI Search button should NOT appear when results exist
    expect(screen.queryByText('AI Search')).not.toBeInTheDocument();
  });

  it('renders AI buy card with local type showing Find Near Me', () => {
    mockWhereToBuyResults = {
      "maker's mark": {
        results: [
          { store: 'LocalShop', priceRange: '$30', url: 'https://local.com', logo: '📍', deliveryNote: 'Nearby', type: 'local' as const },
        ],
        bottleId: 1,
      },
    };
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Find Near Me')).toBeInTheDocument();
  });

  it('renders AI buy card with search type showing Compare Prices', () => {
    mockWhereToBuyResults = {
      "maker's mark": {
        results: [
          { store: 'PriceCheck', priceRange: '$20-40', url: 'https://search.com', logo: '🔍', deliveryNote: 'Compare', type: 'search' as const },
        ],
        bottleId: 1,
      },
    };
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Compare Prices')).toBeInTheDocument();
  });

  it('renders attribute tiles with spirit details', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('ABV')).toBeInTheDocument();
    expect(screen.getByText('Origin')).toBeInTheDocument();
    expect(screen.getByText('Flavor Profile')).toBeInTheDocument();
    // Seed id 1 = Maker's Mark
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Kentucky, USA')).toBeInTheDocument();
  });

  it('renders static BuyCard stores when no AI results', () => {
    vi.mocked(useBottle).mockReturnValue({ data: mockBottle, isLoading: false, isError: false } as any);
    renderWithRoute();
    // Seed id 1 = Maker's Mark has Drizly, Total Wine, ReserveBar
    expect(screen.getByText('Drizly')).toBeInTheDocument();
    expect(screen.getByText('Total Wine & More')).toBeInTheDocument();
  });

  it('shows "not found" when bottle data is null', () => {
    vi.mocked(useBottle).mockReturnValue({ data: null, isLoading: false, isError: false } as any);
    renderWithRoute();
    expect(screen.getByText('Spirit not found.')).toBeInTheDocument();
  });
});
