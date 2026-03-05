import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatPanel } from './ChatPanel';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockSendMessage = vi.fn();

// Mock the useChatStream hook since it does network calls
vi.mock('@/hooks/useChatStream', () => ({
  useChatStream: () => ({
    sendMessage: mockSendMessage,
    cancel: vi.fn(),
  }),
}));

describe('ChatPanel', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    useChatStore.setState({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Welcome!',
          timestamp: new Date(),
          agentName: 'Mixologist',
          suggestions: ['Make a Mojito'],
        },
      ],
      isStreaming: false,
      currentAgentName: 'Mixologist',
    });
    useUIStore.setState({
      isChatOpen: true,
      pageContext: { type: null, id: null, name: null, summary: null },
      pendingChatMessage: null,
    });
  });

  it('renders the chat header with agent name', () => {
    renderWithProviders(<ChatPanel />);
    expect(screen.getAllByText('Mixologist').length).toBeGreaterThanOrEqual(1);
  });

  it('renders messages from the store', () => {
    renderWithProviders(<ChatPanel />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('renders the chat input', () => {
    renderWithProviders(<ChatPanel />);
    expect(screen.getByPlaceholderText('Send message...')).toBeInTheDocument();
  });

  it('applies custom width via prop', () => {
    const { container } = renderWithProviders(<ChatPanel width={400} />);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.style.width).toBe('400px');
  });

  it('defaults to 320px width when no prop', () => {
    const { container } = renderWithProviders(<ChatPanel />);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.style.width).toBe('320px');
  });

  it('shows context pill when page context is set', () => {
    useUIStore.setState({
      pageContext: {
        type: 'spirit',
        id: 1,
        name: 'Hendricks Gin',
        summary: 'Premium gin',
      },
    });
    renderWithProviders(<ChatPanel />);
    expect(screen.getByText('Hendricks Gin')).toBeInTheDocument();
    expect(screen.getByText('Viewing:')).toBeInTheDocument();
  });

  it('does not show context pill when pageContext type is null', () => {
    renderWithProviders(<ChatPanel />);
    expect(screen.queryByText('Viewing:')).not.toBeInTheDocument();
  });

  it('falls back to "Mixologist" when currentAgentName is null', () => {
    useChatStore.setState({ currentAgentName: null });
    renderWithProviders(<ChatPanel />);
    expect(screen.getAllByText('Mixologist').length).toBeGreaterThanOrEqual(1);
  });

  it('auto-sends pendingChatMessage when not streaming', async () => {
    useUIStore.setState({ pendingChatMessage: 'auto-test' });
    renderWithProviders(<ChatPanel />);
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('auto-test');
    });
    expect(useUIStore.getState().pendingChatMessage).toBeNull();
  });

  it('handleSend calls sendMessage on user input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('Send message...');
    await user.type(textarea, 'Hello world{Enter}');
    expect(mockSendMessage).toHaveBeenCalledWith('Hello world');
  });

  it('handleAddToLibrary POSTs recipe and adds success message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid' });
    renderWithProviders(<ChatPanel />);

    // Simulate ChatMessageList calling onAddToLibrary
    // We need to trigger it through the component tree. The ChatMessage renders
    // "Add" buttons when addButtons are present on the last assistant message.
    useChatStore.setState({
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Here is the recipe',
          timestamp: new Date(),
          agentName: 'Mixologist',
          isStreaming: false,
          addButtons: [
            {
              cocktailName: 'Negroni',
              recipeData: {
                name: 'Negroni',
                ingredients: ['1 oz gin', '1 oz Campari', '1 oz sweet vermouth'],
                instructions: 'Stir and serve.',
                category: 'Stirred',
              },
            },
          ],
        },
      ],
    });

    // Find and click the Add button
    const addBtn = await screen.findByText(/Add "Negroni" to Library/);
    const user = userEvent.setup();
    await user.click(addBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/recipes', expect.objectContaining({ method: 'POST' }));
    });
    // Should add a success message
    const msgs = useChatStore.getState().messages;
    const successMsg = msgs.find(m => m.content.includes('has been added'));
    expect(successMsg).toBeDefined();
  });

  it('handleAddToLibrary falls back to sendMessage on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net error')));
    vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid' });
    renderWithProviders(<ChatPanel />);

    useChatStore.setState({
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'test',
          timestamp: new Date(),
          agentName: 'Mixologist',
          isStreaming: false,
          addButtons: [
            {
              cocktailName: 'Daiquiri',
              recipeData: {
                ingredients: ['2 oz rum'],
                instructions: 'Shake.',
              },
            },
          ],
        },
      ],
    });

    const addBtn = await screen.findByText(/Add "Daiquiri" to Library/);
    const user = userEvent.setup();
    await user.click(addBtn);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining('Daiquiri'));
    });
  });

  it('handleAddToLibrary falls back when no recipeData.ingredients', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid' });
    renderWithProviders(<ChatPanel />);

    // Message with a recipe-looking text but no tool addButtons → uses fallback button
    useChatStore.setState({
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: '**The Gimlet**\n\n**Ingredients:**\n- 2 oz Gin\n\n**Instructions:**\nShake and strain.',
          timestamp: new Date(),
          agentName: 'Mixologist',
          isStreaming: false,
        },
      ],
    });

    const addBtn = await screen.findByText(/Add "Gimlet" to Library/);
    const user = userEvent.setup();
    await user.click(addBtn);

    expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining('Gimlet'));
  });
});
