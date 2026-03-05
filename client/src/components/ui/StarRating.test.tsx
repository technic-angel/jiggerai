import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('renders 5 star buttons', () => {
    render(<StarRating value={null} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('labels each star correctly', () => {
    render(<StarRating value={3} />);
    expect(screen.getByLabelText('1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('2 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('5 stars')).toBeInTheDocument();
  });

  it('calls onChange when a star is clicked', () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('3 stars'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('clears rating when clicking current value', () => {
    const onChange = vi.fn();
    render(<StarRating value={4} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('4 stars'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not call onChange when readOnly', () => {
    const onChange = vi.fn();
    render(<StarRating value={3} onChange={onChange} readOnly />);
    fireEvent.click(screen.getByLabelText('2 stars'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables buttons when readOnly', () => {
    render(<StarRating value={3} readOnly />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('does not throw when onChange is undefined', () => {
    render(<StarRating value={3} />);
    expect(() => fireEvent.click(screen.getByLabelText('2 stars'))).not.toThrow();
  });

  it('shows hover state on mouse enter', () => {
    const onChange = vi.fn();
    render(<StarRating value={1} onChange={onChange} />);
    // Hover over star 4 — should highlight stars 1-4
    fireEvent.mouseEnter(screen.getByLabelText('4 stars'));
    // Stars 1-4 should have fill-amber-400 class
    const star4 = screen.getByLabelText('4 stars').querySelector('svg');
    expect(star4?.classList.toString()).toContain('fill-amber-400');
    // Star 5 should NOT be highlighted
    const star5 = screen.getByLabelText('5 stars').querySelector('svg');
    expect(star5?.classList.toString()).toContain('fill-transparent');
  });

  it('resets hover state on mouse leave', () => {
    const onChange = vi.fn();
    const { container } = render(<StarRating value={2} onChange={onChange} />);
    // Hover over star 4
    fireEvent.mouseEnter(screen.getByLabelText('4 stars'));
    // Then leave the container
    const ratingDiv = container.firstElementChild!;
    fireEvent.mouseLeave(ratingDiv);
    // Star 3 should go back to un-highlighted (value is 2)
    const star3 = screen.getByLabelText('3 stars').querySelector('svg');
    expect(star3?.classList.toString()).toContain('fill-transparent');
  });

  it('does not set hover when readOnly', () => {
    render(<StarRating value={1} readOnly />);
    fireEvent.mouseEnter(screen.getByLabelText('3 stars'));
    // Star 3 should not highlight (readOnly prevents hover)
    const star3 = screen.getByLabelText('3 stars').querySelector('svg');
    expect(star3?.classList.toString()).toContain('fill-transparent');
  });
});
