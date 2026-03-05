import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  let onSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSend = vi.fn();
  });

  it('renders a textarea with placeholder', () => {
    render(<ChatInput onSend={onSend} />);
    expect(screen.getByPlaceholderText('Send message...')).toBeInTheDocument();
  });

  it('sends message on button click', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Send message...');
    await user.type(textarea, 'Hello world');
    
    const sendButton = screen.getAllByRole('button').find(
      (btn) => !btn.hasAttribute('aria-label') || btn.getAttribute('aria-label') !== 'Attach file'
    );
    // Click send (last button)
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);

    expect(onSend).toHaveBeenCalledWith('Hello world', undefined);
  });

  it('sends message on Enter key', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Send message...');
    await user.type(textarea, 'Test message{Enter}');

    expect(onSend).toHaveBeenCalledWith('Test message', undefined);
  });

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Send message...');
    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('clears input after send', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Send message...') as HTMLTextAreaElement;
    await user.type(textarea, 'To be cleared{Enter}');

    expect(textarea.value).toBe('');
  });

  it('disables input when disabled prop is true', () => {
    render(<ChatInput onSend={onSend} disabled />);
    const textarea = screen.getByPlaceholderText('Send message...');
    expect(textarea).toBeDisabled();
  });

  it('shows attach button', () => {
    render(<ChatInput onSend={onSend} />);
    expect(screen.getByLabelText('Attach file')).toBeInTheDocument();
  });

  it('clicking attach button triggers file input click', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const fileInput = screen.getByLabelText('Attach files') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');
    await user.click(screen.getByLabelText('Attach file'));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows file preview when file is attached', async () => {
    render(<ChatInput onSend={onSend} />);
    const fileInput = screen.getByLabelText('Attach files') as HTMLInputElement;

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('hello.txt')).toBeInTheDocument();
  });

  it('sends message with attached files', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const fileInput = screen.getByLabelText('Attach files') as HTMLInputElement;
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    await fireEvent.change(fileInput, { target: { files: [file] } });
    const textarea = screen.getByPlaceholderText('Send message...');
    await user.type(textarea, 'Check this file{Enter}');
    expect(onSend).toHaveBeenCalledWith('Check this file', [file]);
  });

  it('sends files even without text', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const fileInput = screen.getByLabelText('Attach files') as HTMLInputElement;
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    await fireEvent.change(fileInput, { target: { files: [file] } });
    // Click send button
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);
    expect(onSend).toHaveBeenCalledWith('', [file]);
  });

  it('removes attached file when X is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} />);
    const fileInput = screen.getByLabelText('Attach files') as HTMLInputElement;

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('hello.txt')).toBeInTheDocument();

    const removeBtn = screen.getByLabelText('Remove hello.txt');
    await user.click(removeBtn);

    expect(screen.queryByText('hello.txt')).not.toBeInTheDocument();
  });
});
