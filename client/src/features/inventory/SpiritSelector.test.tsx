import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpiritSelector } from './SpiritSelector';

describe('SpiritSelector', () => {
  const defaultProps = {
    query: '',
    onQueryChange: vi.fn(),
    selected: new Set<string>(),
    onToggle: vi.fn(),
  };

  it('renders search input', () => {
    render(<SpiritSelector {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search spirits or ingredients…')).toBeInTheDocument();
  });

  it('renders spirit tile buttons', () => {
    render(<SpiritSelector {...defaultProps} />);
    expect(screen.getByText('Whiskey')).toBeInTheDocument();
    expect(screen.getByText('Gin')).toBeInTheDocument();
    expect(screen.getByText('Vodka')).toBeInTheDocument();
  });

  it('renders ingredient tiles', () => {
    render(<SpiritSelector {...defaultProps} />);
    expect(screen.getByText('Lime Juice')).toBeInTheDocument();
    expect(screen.getByText('Bitters')).toBeInTheDocument();
    expect(screen.getByText('Simple Syrup')).toBeInTheDocument();
  });

  it('calls onQueryChange when typing', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<SpiritSelector {...defaultProps} onQueryChange={onQueryChange} />);
    await user.type(screen.getByPlaceholderText('Search spirits or ingredients…'), 'gin');
    expect(onQueryChange).toHaveBeenCalled();
  });

  it('calls onToggle when clicking a tile', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<SpiritSelector {...defaultProps} onToggle={onToggle} />);
    await user.click(screen.getByText('Gin'));
    expect(onToggle).toHaveBeenCalledWith('Gin');
  });

  it('applies selected style when tile is in selected set', () => {
    const selected = new Set(['Gin']);
    render(<SpiritSelector {...defaultProps} selected={selected} />);
    const ginButton = screen.getByText('Gin').closest('button');
    expect(ginButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows section headings', () => {
    render(<SpiritSelector {...defaultProps} />);
    expect(screen.getByText('Select Spirits')).toBeInTheDocument();
    expect(screen.getByText('Select Ingredients')).toBeInTheDocument();
  });
});
