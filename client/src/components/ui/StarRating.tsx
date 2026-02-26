import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number | null) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayed = hovered ?? value ?? 0;

  function handleClick(star: number) {
    if (readOnly || !onChange) return;
    // Clicking the current rating again clears it
    onChange(star === value ? null : star);
  }

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          className={cn(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 focus:outline-none',
          )}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              SIZE_MAP[size],
              star <= displayed
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}
