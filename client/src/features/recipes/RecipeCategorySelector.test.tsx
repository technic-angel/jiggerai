import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeCategorySelector, type RecipeFilters } from './RecipeCategorySelector';

const defaultFilters: RecipeFilters = {
  query: '',
  spirits: new Set<string>(),
  styles: new Set<string>(),
  makeableOnly: false,
  favoritesOnly: false,
};

describe('RecipeCategorySelector', () => {
  const defaultProps = {
    filters: defaultFilters,
    onQueryChange: vi.fn(),
    onSpiritToggle: vi.fn(),
    onStyleToggle: vi.fn(),
    onMakeableToggle: vi.fn(),
    onFavoritesToggle: vi.fn(),
  };

  it('renders search input', () => {
    render(<RecipeCategorySelector {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search cocktails or ingredients…')).toBeInTheDocument();
  });

  it('renders spirit filter tiles', () => {
    render(<RecipeCategorySelector {...defaultProps} />);
    expect(screen.getByText('By Spirit')).toBeInTheDocument();
  });

  it('renders style filter tiles', () => {
    render(<RecipeCategorySelector {...defaultProps} />);
    expect(screen.getByText('Style')).toBeInTheDocument();
  });

  it('renders makeable toggle', () => {
    render(<RecipeCategorySelector {...defaultProps} />);
    expect(screen.getByText('I can make this')).toBeInTheDocument();
  });

  it('renders favorites toggle', () => {
    render(<RecipeCategorySelector {...defaultProps} />);
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('calls onSpiritToggle when clicking a spirit tile', async () => {
    const user = userEvent.setup();
    const onSpiritToggle = vi.fn();
    render(<RecipeCategorySelector {...defaultProps} onSpiritToggle={onSpiritToggle} />);
    // Find a spirit tile by its label
    const ginButtons = screen.getAllByText('Gin');
    await user.click(ginButtons[0]);
    expect(onSpiritToggle).toHaveBeenCalledWith('Gin');
  });

  it('calls onMakeableToggle when clicked', async () => {
    const user = userEvent.setup();
    const onMakeableToggle = vi.fn();
    render(<RecipeCategorySelector {...defaultProps} onMakeableToggle={onMakeableToggle} />);
    await user.click(screen.getByText('I can make this'));
    expect(onMakeableToggle).toHaveBeenCalled();
  });

  it('calls onFavoritesToggle when clicked', async () => {
    const user = userEvent.setup();
    const onFavoritesToggle = vi.fn();
    render(<RecipeCategorySelector {...defaultProps} onFavoritesToggle={onFavoritesToggle} />);
    await user.click(screen.getByText('Favorites'));
    expect(onFavoritesToggle).toHaveBeenCalled();
  });

  it('calls onStyleToggle when clicking a style tile', async () => {
    const user = userEvent.setup();
    const onStyleToggle = vi.fn();
    render(<RecipeCategorySelector {...defaultProps} onStyleToggle={onStyleToggle} />);
    await user.click(screen.getByText('Stirred'));
    expect(onStyleToggle).toHaveBeenCalledWith('Stirred');
  });

  it('shows selected state for spirits', () => {
    const selectedFilters = { ...defaultFilters, spirits: new Set(['Gin']) };
    render(<RecipeCategorySelector {...defaultProps} filters={selectedFilters} />);
    const ginButtons = screen.getAllByText('Gin');
    const ginButton = ginButtons[0].closest('button')!;
    expect(ginButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows selected state for styles', () => {
    const selectedFilters = { ...defaultFilters, styles: new Set(['Stirred']) };
    render(<RecipeCategorySelector {...defaultProps} filters={selectedFilters} />);
    const stirredButton = screen.getByText('Stirred').closest('button')!;
    expect(stirredButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows selected state for makeable toggle', () => {
    const activeFilters = { ...defaultFilters, makeableOnly: true };
    render(<RecipeCategorySelector {...defaultProps} filters={activeFilters} />);
    const btn = screen.getByText('I can make this').closest('button')!;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows selected state for favorites toggle', () => {
    const activeFilters = { ...defaultFilters, favoritesOnly: true };
    render(<RecipeCategorySelector {...defaultProps} filters={activeFilters} />);
    const btn = screen.getByText('Favorites').closest('button')!;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onQueryChange on input typing', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<RecipeCategorySelector {...defaultProps} onQueryChange={onQueryChange} />);
    await user.type(screen.getByPlaceholderText('Search cocktails or ingredients…'), 'gin');
    expect(onQueryChange).toHaveBeenCalled();
  });
});
