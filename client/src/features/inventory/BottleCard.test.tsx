import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottleCard } from './BottleCard';
import type { Bottle } from '@/types';

const bottle: Bottle = {
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

describe('BottleCard', () => {
  it('renders spirit name', () => {
    render(<BottleCard bottle={bottle} />);
    expect(screen.getByText('Hendricks Gin')).toBeInTheDocument();
  });

  it('shows volume fraction', () => {
    render(<BottleCard bottle={bottle} />);
    expect(screen.getByText('6/8 full')).toBeInTheDocument();
  });

  it('shows initials when no image', () => {
    render(<BottleCard bottle={bottle} />);
    expect(screen.getByText('HG')).toBeInTheDocument();
  });

  it('shows image when imageUrl is set', () => {
    const withImage = { ...bottle, imageUrl: '/gin.jpg' };
    render(<BottleCard bottle={withImage} />);
    const img = screen.getByAltText('Hendricks Gin');
    expect(img).toHaveAttribute('src', '/gin.jpg');
  });

  it('applies custom className', () => {
    const { container } = render(<BottleCard bottle={bottle} className="mt-4" />);
    expect(container.firstElementChild).toHaveClass('mt-4');
  });
});
