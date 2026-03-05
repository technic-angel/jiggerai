import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types';

const baseAssistant: ChatMessageType = {
  id: 'msg-1',
  role: 'assistant',
  content: 'Hello, I am **Mixologist**!',
  timestamp: new Date(),
  agentName: 'Mixologist',
};

const baseUser: ChatMessageType = {
  id: 'msg-2',
  role: 'user',
  content: 'What can I make with vodka?',
  timestamp: new Date(),
};

describe('ChatMessage', () => {
  describe('assistant messages', () => {
    it('renders agent name', () => {
      render(<ChatMessage message={baseAssistant} />);
      expect(screen.getAllByText('Mixologist').length).toBeGreaterThanOrEqual(1);
    });

    it('renders markdown content', () => {
      render(<ChatMessage message={baseAssistant} />);
      // Bold text in markdown
      expect(screen.getByText('Mixologist', { selector: 'strong' })).toBeInTheDocument();
    });

    it('renders avatar image', () => {
      render(<ChatMessage message={baseAssistant} />);
      const img = screen.getByAltText('');
      expect(img).toHaveAttribute('src', '/jigger-logo.svg');
    });

    it('shows typing dots when streaming with empty content', () => {
      const streaming: ChatMessageType = {
        ...baseAssistant,
        content: '',
        isStreaming: true,
      };
      const { container } = render(<ChatMessage message={streaming} />);
      // Three animated dots
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });

    it('renders content while streaming (not empty)', () => {
      const streaming: ChatMessageType = {
        ...baseAssistant,
        content: 'Partial response...',
        isStreaming: true,
      };
      render(<ChatMessage message={streaming} />);
      expect(screen.getByText('Partial response...')).toBeInTheDocument();
    });
  });

  describe('user messages', () => {
    it('renders plain text content', () => {
      render(<ChatMessage message={baseUser} />);
      expect(screen.getByText('What can I make with vodka?')).toBeInTheDocument();
    });

    it('does not render agent name or avatar', () => {
      render(<ChatMessage message={baseUser} />);
      expect(screen.queryByText('Mixologist')).not.toBeInTheDocument();
    });
  });

  describe('suggestion chips', () => {
    it('renders suggestion buttons for non-streaming assistant messages', () => {
      const withSuggestions: ChatMessageType = {
        ...baseAssistant,
        suggestions: ['Make a Mojito', 'Suggest a whiskey drink'],
      };
      render(<ChatMessage message={withSuggestions} showSuggestions />);
      expect(screen.getByText('Make a Mojito')).toBeInTheDocument();
      expect(screen.getByText('Suggest a whiskey drink')).toBeInTheDocument();
    });

    it('calls onSuggestionClick when chip is clicked', () => {
      const onClick = vi.fn();
      const withSuggestions: ChatMessageType = {
        ...baseAssistant,
        suggestions: ['Make a Mojito'],
      };
      render(<ChatMessage message={withSuggestions} onSuggestionClick={onClick} showSuggestions />);
      fireEvent.click(screen.getByText('Make a Mojito'));
      expect(onClick).toHaveBeenCalledWith('Make a Mojito');
    });

    it('does not render suggestions while streaming', () => {
      const withSuggestions: ChatMessageType = {
        ...baseAssistant,
        content: 'Loading...',
        isStreaming: true,
        suggestions: ['Make a Mojito'],
      };
      render(<ChatMessage message={withSuggestions} showSuggestions />);
      expect(screen.queryByText('Make a Mojito')).not.toBeInTheDocument();
    });

    it('does not render suggestions for user messages', () => {
      const userWithSuggestions: ChatMessageType = {
        ...baseUser,
        suggestions: ['Should not appear'],
      };
      render(<ChatMessage message={userWithSuggestions} showSuggestions />);
      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });
  });

  describe('YouTube video embeds', () => {
    it('renders tool-result YouTube video embeds', () => {
      const withYoutube: ChatMessageType = {
        ...baseAssistant,
        youtubeVideos: [
          { videoId: 'abc123def45', title: 'How to make a Negroni', thumbnail: '' },
        ],
      };
      const { container } = render(<ChatMessage message={withYoutube} />);
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe?.src).toContain('abc123def45');
    });

    it('renders the video title when it differs from "Watch on YouTube"', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        youtubeVideos: [
          { videoId: 'abc123def45', title: 'How to make a Negroni', thumbnail: '' },
        ],
      };
      render(<ChatMessage message={msg} />);
      expect(screen.getByText('How to make a Negroni')).toBeInTheDocument();
    });

    it('does not render title when it equals "Watch on YouTube"', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        youtubeVideos: [
          { videoId: 'abc123def45', title: 'Watch on YouTube', thumbnail: '' },
        ],
      };
      render(<ChatMessage message={msg} />);
      expect(screen.queryByText('Watch on YouTube')).not.toBeInTheDocument();
    });

    it('extracts YouTube IDs from message text and renders embeds', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        content: 'Check this out: https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
      const { container } = render(<ChatMessage message={msg} />);
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe?.src).toContain('dQw4w9WgXcQ');
    });

    it('deduplicates inline-parsed IDs with tool-result IDs', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        content: 'Check this out: https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideos: [
          { videoId: 'dQw4w9WgXcQ', title: 'Rick Astley', thumbnail: '' },
        ],
      };
      const { container } = render(<ChatMessage message={msg} />);
      const iframes = container.querySelectorAll('iframe');
      expect(iframes).toHaveLength(1);
    });
  });

  describe('Where-to-Buy cards', () => {
    it('renders retailer cards when whereToBuyCards is present', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        whereToBuyCards: {
          ingredientName: 'Hendricks Gin',
          results: [
            { store: 'Drizly', priceRange: '$30-40', deliveryNote: '1-2 days', url: 'http://drizly.com', logo: '', type: 'online' },
            { store: 'BevMo', priceRange: '$28-35', deliveryNote: 'Pickup', url: 'http://bevmo.com', logo: '', type: 'local' },
          ],
        },
      };
      render(<ChatMessage message={msg} />);
      expect(screen.getByText('Drizly')).toBeInTheDocument();
      expect(screen.getByText('BevMo')).toBeInTheDocument();
      expect(screen.getByText(/Where to buy · Hendricks Gin/)).toBeInTheDocument();
      expect(screen.getByText('📍 Local')).toBeInTheDocument();
      expect(screen.getByText('🛒 Online')).toBeInTheDocument();
    });

    it('renders search type indicator', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        whereToBuyCards: {
          ingredientName: 'Bourbon',
          results: [
            { store: 'Google', priceRange: 'Varies', deliveryNote: 'Search', url: 'http://g.com', logo: '', type: 'search' },
          ],
        },
      };
      render(<ChatMessage message={msg} />);
      expect(screen.getByText('🔍 Search')).toBeInTheDocument();
    });
  });

  describe('Add to Library buttons', () => {
    it('renders tool-result add buttons', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        isStreaming: false,
        addButtons: [
          { cocktailName: 'Negroni', recipeData: { ingredients: ['gin'] } },
        ],
      };
      render(<ChatMessage message={msg} />);
      expect(screen.getByText(/Add "Negroni" to Library/)).toBeInTheDocument();
    });

    it('calls onAddToLibrary when tool button is clicked', () => {
      const onAddToLibrary = vi.fn();
      const msg: ChatMessageType = {
        ...baseAssistant,
        isStreaming: false,
        addButtons: [
          { cocktailName: 'Negroni', recipeData: { ingredients: ['gin'] } },
        ],
      };
      render(<ChatMessage message={msg} onAddToLibrary={onAddToLibrary} />);
      fireEvent.click(screen.getByText(/Add "Negroni" to Library/));
      expect(onAddToLibrary).toHaveBeenCalledWith('Negroni', { ingredients: ['gin'] });
    });

    it('renders fallback add button when message looks like a recipe', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        isStreaming: false,
        content: '**The Gimlet**\n\n**Ingredients:**\n- 2 oz Gin\n- 1 oz Lime\n\n**Instructions:**\nShake and strain into coupe.',
      };
      render(<ChatMessage message={msg} />);
      expect(screen.getByText(/Add "Gimlet" to Library/)).toBeInTheDocument();
    });

    it('shows generic label "this cocktail" when no name can be extracted', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        isStreaming: false,
        content: 'Here are the ingredients and instructions for a cocktail:\n- 2 oz Gin\nStep 1: Shake with ice.',
      };
      render(<ChatMessage message={msg} />);
      expect(screen.getByText(/Add "this cocktail" to Library/)).toBeInTheDocument();
    });

    it('does not show add button while streaming', () => {
      const msg: ChatMessageType = {
        ...baseAssistant,
        isStreaming: true,
        content: 'Here are the ingredients and instructions:\n- 2 oz Gin\nStep 1: Shake',
      };
      render(<ChatMessage message={msg} />);
      expect(screen.queryByText(/Add .* to Library/)).not.toBeInTheDocument();
    });
  });
});
