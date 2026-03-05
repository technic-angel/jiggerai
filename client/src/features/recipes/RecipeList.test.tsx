import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeList } from './RecipeList';
import type { Recipe } from '@/types';

const makeRecipe = (id: number, name: string, overrides?: Partial<Recipe>): Recipe => ({
  id,
  name,
  category: 'Stirred',
  baseSpirit: 'Whiskey',
  ingredients: ['2 oz Bourbon', '1 tsp Sugar'],
  instructions: 'Stir and serve.',
  youtubeUrl: null,
  imageUrl: null,
  abv: '32%',
  glassType: 'Rocks',
  difficulty: 'Easy',
  imageEmoji: '🥃',
  rating: null,
  equipment: null,
  ...overrides,
});

describe('RecipeList', () => {
  it('shows empty state when no items', () => {
    render(<RecipeList items={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No cocktails match your filters.')).toBeInTheDocument();
  });

  it('renders recipe names', () => {
    const items = [makeRecipe(1, 'Old Fashioned'), makeRecipe(2, 'Manhattan')];
    render(<RecipeList items={items} onSelect={vi.fn()} />);
    expect(screen.getByText('Old Fashioned')).toBeInTheDocument();
    expect(screen.getByText('Manhattan')).toBeInTheDocument();
  });

  it('shows total count', () => {
    const items = [makeRecipe(1, 'A'), makeRecipe(2, 'B'), makeRecipe(3, 'C')];
    render(<RecipeList items={items} onSelect={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onSelect when clicking a recipe', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const items = [makeRecipe(1, 'Old Fashioned')];
    render(<RecipeList items={items} onSelect={onSelect} />);
    await user.click(screen.getByText('Old Fashioned'));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it('shows makeable badge', () => {
    const items = [makeRecipe(1, 'Old Fashioned', { isMakeable: true })];
    render(<RecipeList items={items} onSelect={vi.fn()} />);
    expect(screen.getByText('✓ makeable')).toBeInTheDocument();
  });

  it('shows favorite heart', () => {
    const items = [makeRecipe(1, 'Old Fashioned', { isFavorite: true })];
    const { container } = render(<RecipeList items={items} onSelect={vi.fn()} />);
    // Should have filled heart SVG
    const heart = container.querySelector('.fill-rose-500');
    expect(heart).toBeInTheDocument();
  });

  it('shows difficulty dot', () => {
    const items = [makeRecipe(1, 'Test', { difficulty: 'Easy' })];
    const { container } = render(<RecipeList items={items} onSelect={vi.fn()} />);
    const dot = container.querySelector('.bg-teal-400.rounded-full');
    expect(dot).toBeInTheDocument();
  });
});
