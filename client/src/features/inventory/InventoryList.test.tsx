import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InventoryList } from './InventoryList';
import type { Bottle } from '@/types';

const makeBottle = (id: number, name: string, cat: string, vol: number): Bottle => ({
  id,
  userId: 'u1',
  spiritName: name,
  category: cat,
  volumeEighths: vol,
  purchasePrice: null,
  imageUrl: null,
  isFavorite: 0,
  unopenedCount: 0,
  updatedAt: '2024-01-01',
  rating: null,
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('InventoryList', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('shows empty state when no items', () => {
    render(
      <MemoryRouter>
        <InventoryList items={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText('No items match your selection.')).toBeInTheDocument();
  });

  it('displays total count', () => {
    const items = [makeBottle(1, 'Hendricks', 'Gin', 6), makeBottle(2, 'Maker', 'Bourbon', 4)];
    render(
      <MemoryRouter>
        <InventoryList items={items} />
      </MemoryRouter>
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders spirit names', () => {
    const items = [makeBottle(1, 'Hendricks', 'Gin', 6)];
    render(
      <MemoryRouter>
        <InventoryList items={items} />
      </MemoryRouter>
    );
    expect(screen.getByText('Hendricks')).toBeInTheDocument();
  });

  it('navigates to detail on row click', async () => {
    const user = userEvent.setup();
    const items = [makeBottle(1, 'Hendricks', 'Gin', 6)];
    render(
      <MemoryRouter>
        <InventoryList items={items} />
      </MemoryRouter>
    );
    await user.click(screen.getByText('Hendricks'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-bar/1');
  });

  it('shows volume dot indicator', () => {
    const items = [makeBottle(1, 'Test', 'Gin', 7)];
    const { container } = render(
      <MemoryRouter>
        <InventoryList items={items} />
      </MemoryRouter>
    );
    // Should have a teal dot (>=75%)
    const dot = container.querySelector('.bg-teal-400.rounded-full');
    expect(dot).toBeInTheDocument();
  });
});
