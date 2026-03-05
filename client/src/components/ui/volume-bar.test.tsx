import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VolumeBar } from './volume-bar';

describe('VolumeBar', () => {
  it('renders 8 segments', () => {
    const { container } = render(<VolumeBar volumeEighths={4} />);
    const segments = container.querySelectorAll('.rounded-full');
    expect(segments).toHaveLength(8);
  });

  it('fills correct number of segments', () => {
    const { container } = render(<VolumeBar volumeEighths={5} />);
    const segments = container.querySelectorAll('.rounded-full');
    const filled = Array.from(segments).filter((s) =>
      s.classList.contains('bg-teal-400')
    );
    expect(filled).toHaveLength(5);
  });

  it('handles 0 volume (no filled segments)', () => {
    const { container } = render(<VolumeBar volumeEighths={0} />);
    const filled = container.querySelectorAll('.bg-teal-400');
    expect(filled).toHaveLength(0);
  });

  it('handles full volume (all segments filled)', () => {
    const { container } = render(<VolumeBar volumeEighths={8} />);
    const filled = container.querySelectorAll('.bg-teal-400');
    expect(filled).toHaveLength(8);
  });

  it('caps volume at 8 even if given more', () => {
    const { container } = render(<VolumeBar volumeEighths={12} />);
    const filled = container.querySelectorAll('.bg-teal-400');
    expect(filled).toHaveLength(8);
  });

  it('floors volume at 0 for negative values', () => {
    const { container } = render(<VolumeBar volumeEighths={-3} />);
    const filled = container.querySelectorAll('.bg-teal-400');
    expect(filled).toHaveLength(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <VolumeBar volumeEighths={4} className="mt-2" />
    );
    expect(container.firstElementChild).toHaveClass('mt-2');
  });
});
