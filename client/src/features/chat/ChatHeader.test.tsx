import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHeader } from './ChatHeader';

describe('ChatHeader', () => {
  it('renders the agent name', () => {
    render(<ChatHeader agentName="Mixologist" onClose={vi.fn()} />);
    expect(screen.getByText('Mixologist')).toBeInTheDocument();
  });

  it('renders a logo image', () => {
    render(<ChatHeader agentName="Mixologist" onClose={vi.fn()} />);
    const img = screen.getByAltText('');
    expect(img).toHaveAttribute('src', '/jigger-logo.svg');
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<ChatHeader agentName="Mixologist" onClose={onClose} />);
    // The X button is the last button
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays different agent names', () => {
    render(<ChatHeader agentName="Inventory Bot" onClose={vi.fn()} />);
    expect(screen.getByText('Inventory Bot')).toBeInTheDocument();
  });
});
