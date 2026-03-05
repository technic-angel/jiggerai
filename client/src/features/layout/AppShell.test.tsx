import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

// Configurable mock state
let mockChatOpen = false;
const mockToggleChat = vi.fn();

vi.mock('@/store/uiStore', () => ({
  useUIStore: (sel: any) => {
    const state = {
      isChatOpen: mockChatOpen,
      toggleChat: mockToggleChat,
    };
    return sel(state);
  },
}));

// Mock ChatPanel to avoid rendering the full chat
vi.mock('@/features/chat/ChatPanel', () => ({
  ChatPanel: ({ width }: { width: number }) => <div data-testid="chat-panel" data-width={width}>Chat Panel</div>,
}));

// Mock Sidebar
vi.mock('./Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

describe('AppShell', () => {
  beforeEach(() => {
    mockChatOpen = false;
    mockToggleChat.mockClear();
  });

  it('renders sidebar', () => {
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders floating chat button when chat is closed', () => {
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
  });

  it('calls toggleChat when floating button is clicked', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    await user.click(screen.getByLabelText('Open chat'));
    expect(mockToggleChat).toHaveBeenCalled();
  });

  it('renders ChatPanel when chat is open', () => {
    mockChatOpen = true;
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('does NOT render floating button when chat is open', () => {
    mockChatOpen = true;
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.queryByLabelText('Open chat')).not.toBeInTheDocument();
  });

  it('does NOT render ChatPanel when chat is closed', () => {
    mockChatOpen = false;
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('renders drag handle when chat is open', () => {
    mockChatOpen = true;
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.getByTitle('Drag to resize')).toBeInTheDocument();
  });

  it('drag handle mouseDown starts resize', () => {
    mockChatOpen = true;
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    const handle = screen.getByTitle('Drag to resize');
    fireEvent.mouseDown(handle, { clientX: 500 });
    expect(document.body.style.cursor).toBe('col-resize');
    // Simulate mouseUp to clean up
    fireEvent.mouseUp(window);
    expect(document.body.style.cursor).toBe('');
  });

  it('drag handle mouseMove resizes chat panel', () => {
    mockChatOpen = true;
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    const handle = screen.getByTitle('Drag to resize');
    const panel = screen.getByTestId('chat-panel');
    const startWidth = Number(panel.getAttribute('data-width'));
    // Start drag at 500, then move left to 450 — should increase width by 50
    fireEvent.mouseDown(handle, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 450 });
    const newWidth = Number(screen.getByTestId('chat-panel').getAttribute('data-width'));
    expect(newWidth).toBe(startWidth + 50);
    // Clean up
    fireEvent.mouseUp(window);
  });

  it('renders main content area', () => {
    render(<MemoryRouter><AppShell /></MemoryRouter>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
