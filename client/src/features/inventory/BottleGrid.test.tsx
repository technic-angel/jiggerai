import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottleGrid } from './BottleGrid';
import type { Bottle } from '@/types';

const makeBottle = (id: number, name: string): Bottle => ({
  id,
  userId: 'u1',
  spiritName: name,
  category: 'Gin',
  volumeEighths: 6,
  purchasePrice: null,
  imageUrl: null,
  isFavorite: 0,
  unopenedCount: 0,
  updatedAt: '2024-01-01',
  rating: null,
});

describe('BottleGrid', () => {
  it('shows empty state when no bottles', () => {
    render(<BottleGrid bottles={[]} />);
    expect(screen.getByText('Your bar is empty')).toBeInTheDocument();
    expect(screen.getByText('Add your first bottle to get started.')).toBeInTheDocument();
  });

  it('renders a card for each bottle', () => {
    const bottles = [makeBottle(1, 'Hendricks'), makeBottle(2, 'Tanqueray')];
    render(<BottleGrid bottles={bottles} />);
    expect(screen.getByText('Hendricks')).toBeInTheDocument();
    expect(screen.getByText('Tanqueray')).toBeInTheDocument();
  });

  it('renders in a grid layout', () => {
    const bottles = [makeBottle(1, 'Hendricks')];
    const { container } = render(<BottleGrid bottles={bottles} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
