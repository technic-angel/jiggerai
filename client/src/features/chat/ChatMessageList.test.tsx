import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessageList } from './ChatMessageList';
import type { ChatMessage } from '@/types';

const messages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Welcome message',
    timestamp: new Date(),
    agentName: 'Mixologist',
  },
  {
    id: 'user-1',
    role: 'user',
    content: 'What cocktails can I make?',
    timestamp: new Date(),
  },
  {
    id: 'assist-1',
    role: 'assistant',
    content: 'Here are some ideas!',
    timestamp: new Date(),
    agentName: 'Mixologist',
  },
];

describe('ChatMessageList', () => {
  it('renders all messages', () => {
    render(<ChatMessageList messages={messages} />);
    expect(screen.getByText('Welcome message')).toBeInTheDocument();
    expect(screen.getByText('What cocktails can I make?')).toBeInTheDocument();
    expect(screen.getByText('Here are some ideas!')).toBeInTheDocument();
  });

  it('renders empty list without crashing', () => {
    render(<ChatMessageList messages={[]} />);
    // Should still render the container without errors
  });

  it('passes onSuggestionClick to child messages', () => {
    const onClick = vi.fn();
    const messagesWithSuggestions: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Try these:',
        timestamp: new Date(),
        agentName: 'Mixologist',
        suggestions: ['Vodka Tonic'],
      },
    ];
    render(
      <ChatMessageList
        messages={messagesWithSuggestions}
        onSuggestionClick={onClick}
      />
    );
    screen.getByText('Vodka Tonic').click();
    expect(onClick).toHaveBeenCalledWith('Vodka Tonic');
  });
});
