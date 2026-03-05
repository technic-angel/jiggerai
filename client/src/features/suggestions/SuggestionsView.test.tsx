import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestionsView } from './SuggestionsView';

const mockOpenChat = vi.fn();
const mockSetPageContext = vi.fn();
vi.mock('@/store/uiStore', () => ({
  useUIStore: (sel: any) => {
    const state = { openChat: mockOpenChat, setPageContext: mockSetPageContext };
    return sel(state);
  },
}));

describe('SuggestionsView', () => {
  beforeEach(() => {
    mockOpenChat.mockClear();
    mockSetPageContext.mockClear();
  });

  it('renders the heading', () => {
    render(<SuggestionsView />);
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
  });

  it('renders category cards', () => {
    render(<SuggestionsView />);
    expect(screen.getByText('Cocktail Ideas')).toBeInTheDocument();
    expect(screen.getByText('Spirit Exploration')).toBeInTheDocument();
    expect(screen.getByText('Technique & Tips')).toBeInTheDocument();
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
    expect(screen.getByText('Personalized For You')).toBeInTheDocument();
  });

  it('renders custom input', () => {
    render(<SuggestionsView />);
    expect(screen.getByPlaceholderText(/good cocktail for a whiskey beginner/)).toBeInTheDocument();
  });

  it('sends custom prompt to chat on Ask button', async () => {
    const user = userEvent.setup();
    render(<SuggestionsView />);
    await user.type(screen.getByPlaceholderText(/good cocktail/), 'Test prompt');
    await user.click(screen.getByText('Ask'));
    expect(mockSetPageContext).toHaveBeenCalled();
    expect(mockOpenChat).toHaveBeenCalled();
  });

  it('Ask button is disabled when input is empty', () => {
    render(<SuggestionsView />);
    const askBtn = screen.getByText('Ask').closest('button');
    expect(askBtn).toBeDisabled();
  });

  it('sends prompt when clicking a suggestion chip', async () => {
    const user = userEvent.setup();
    render(<SuggestionsView />);
    await user.click(screen.getByText('Suggest a smoky cocktail'));
    expect(mockSetPageContext).toHaveBeenCalled();
    expect(mockOpenChat).toHaveBeenCalled();
  });

  it('clears input after sending custom prompt', async () => {
    const user = userEvent.setup();
    render(<SuggestionsView />);
    const input = screen.getByPlaceholderText(/good cocktail/);
    await user.type(input, 'Hello');
    await user.click(screen.getByText('Ask'));
    expect(input).toHaveValue('');
  });

  it('sends on Enter key', async () => {
    const user = userEvent.setup();
    render(<SuggestionsView />);
    const input = screen.getByPlaceholderText(/good cocktail/);
    await user.type(input, 'My question{Enter}');
    expect(mockSetPageContext).toHaveBeenCalled();
    expect(mockOpenChat).toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('Enter key does nothing when input is empty', async () => {
    const user = userEvent.setup();
    render(<SuggestionsView />);
    const input = screen.getByPlaceholderText(/good cocktail/);
    await user.type(input, '{Enter}');
    expect(mockOpenChat).not.toHaveBeenCalled();
  });

  it('renders description text', () => {
    render(<SuggestionsView />);
    expect(screen.getByText(/Click any prompt/)).toBeInTheDocument();
  });

  it('renders Ask anything label', () => {
    render(<SuggestionsView />);
    expect(screen.getByText('Ask anything')).toBeInTheDocument();
  });

  it('renders multiple suggestion chips per category', () => {
    render(<SuggestionsView />);
    // Cocktail Ideas has at least 5 prompts
    expect(screen.getByText('What can I make with gin and cucumber?')).toBeInTheDocument();
    expect(screen.getByText("What's a good low-ABV drink?")).toBeInTheDocument();
  });
});
