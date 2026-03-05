import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InventoryView } from './InventoryView';

// Mock useInventory
vi.mock('@/hooks/useInventory', () => ({
  useInventory: vi.fn(),
}));

import { useInventory } from '@/hooks/useInventory';

const bottles = [
  { id: 1, userId: 'u1', spiritName: 'Hendricks', category: 'Gin', volumeEighths: 6, purchasePrice: null, imageUrl: null, isFavorite: 0, unopenedCount: 0, updatedAt: '2024-01-01', rating: null },
  { id: 2, userId: 'u1', spiritName: 'Buffalo Trace', category: 'Bourbon', volumeEighths: 3, purchasePrice: null, imageUrl: null, isFavorite: 0, unopenedCount: 0, updatedAt: '2024-01-01', rating: null },
  { id: 3, userId: 'u1', spiritName: 'Patron', category: 'Tequila', volumeEighths: 8, purchasePrice: null, imageUrl: null, isFavorite: 0, unopenedCount: 0, updatedAt: '2024-01-01', rating: null },
];

describe('InventoryView', () => {
  beforeEach(() => {
    vi.mocked(useInventory).mockReturnValue({
      data: bottles,
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders the heading', () => {
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    expect(screen.getByText('My Home Bar')).toBeInTheDocument();
  });

  it('renders inventory items', () => {
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    expect(screen.getByText('Hendricks')).toBeInTheDocument();
    expect(screen.getByText('Buffalo Trace')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useInventory).mockReturnValue({ data: undefined, isLoading: true, isError: false } as any);
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    expect(screen.getByText('Loading your bar…')).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useInventory).mockReturnValue({ data: undefined, isLoading: false, isError: true } as any);
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    expect(screen.getByText(/Failed to load inventory/)).toBeInTheDocument();
  });

  it('renders the spirit selector', () => {
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    expect(screen.getByPlaceholderText('Search spirits or ingredients…')).toBeInTheDocument();
  });

  it('filters by search query', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    await user.type(screen.getByPlaceholderText('Search spirits or ingredients…'), 'Hendricks');
    expect(screen.getByText('Hendricks')).toBeInTheDocument();
    expect(screen.queryByText('Buffalo Trace')).not.toBeInTheDocument();
    expect(screen.queryByText('Patron')).not.toBeInTheDocument();
  });

  it('filters by category when a tile is toggled', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    // Click the Gin tile
    await user.click(screen.getByText('Gin'));
    expect(screen.getByText('Hendricks')).toBeInTheDocument();
    expect(screen.queryByText('Buffalo Trace')).not.toBeInTheDocument();
  });

  it('shows all items when filter is deselected', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    // Toggle Gin on then off
    await user.click(screen.getByText('Gin'));
    await user.click(screen.getByText('Gin'));
    expect(screen.getByText('Hendricks')).toBeInTheDocument();
    expect(screen.getByText('Buffalo Trace')).toBeInTheDocument();
  });

  it('renders empty inventory correctly', () => {
    vi.mocked(useInventory).mockReturnValue({ data: [], isLoading: false, isError: false } as any);
    render(<MemoryRouter><InventoryView /></MemoryRouter>);
    expect(screen.getByText('No items match your selection.')).toBeInTheDocument();
  });
});
