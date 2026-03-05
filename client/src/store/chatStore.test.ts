import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useChatStore.setState({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Welcome',
          timestamp: new Date(),
          agentName: 'Mixologist',
          suggestions: ['Suggest 1'],
        },
      ],
      isStreaming: false,
      currentAgentName: null,
    });
  });

  it('has a welcome message on init', () => {
    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('assistant');
    expect(state.messages[0].id).toBe('welcome');
  });

  describe('addMessage', () => {
    it('appends a message', () => {
      useChatStore.getState().addMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      });
      expect(useChatStore.getState().messages).toHaveLength(2);
      expect(useChatStore.getState().messages[1].content).toBe('Hello');
    });
  });

  describe('appendTokenToLastMessage', () => {
    it('appends text to the last assistant message', () => {
      useChatStore.getState().addMessage({
        id: 'assist-1',
        role: 'assistant',
        content: 'Hi',
        timestamp: new Date(),
        isStreaming: true,
      });
      useChatStore.getState().appendTokenToLastMessage(' there');
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].content).toBe('Hi there');
    });

    it('does nothing when last message is a user message', () => {
      useChatStore.getState().addMessage({
        id: 'user-1',
        role: 'user',
        content: 'question',
        timestamp: new Date(),
      });
      useChatStore.getState().appendTokenToLastMessage('extra');
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].content).toBe('question');
    });
  });

  describe('markLastMessageDone', () => {
    it('sets isStreaming to false on last assistant message', () => {
      useChatStore.getState().addMessage({
        id: 'assist-2',
        role: 'assistant',
        content: 'test',
        timestamp: new Date(),
        isStreaming: true,
      });
      useChatStore.getState().markLastMessageDone();
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].isStreaming).toBe(false);
    });
  });

  describe('setCurrentAgent', () => {
    it('sets agent name', () => {
      useChatStore.getState().setCurrentAgent('Mixologist');
      expect(useChatStore.getState().currentAgentName).toBe('Mixologist');
    });

    it('accepts null', () => {
      useChatStore.getState().setCurrentAgent('Mixologist');
      useChatStore.getState().setCurrentAgent(null);
      expect(useChatStore.getState().currentAgentName).toBeNull();
    });
  });

  describe('setStreaming', () => {
    it('toggles streaming state', () => {
      useChatStore.getState().setStreaming(true);
      expect(useChatStore.getState().isStreaming).toBe(true);
      useChatStore.getState().setStreaming(false);
      expect(useChatStore.getState().isStreaming).toBe(false);
    });
  });

  describe('clearMessages', () => {
    it('removes all messages', () => {
      useChatStore.getState().clearMessages();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });
  });

  describe('appendYoutubeToLastMessage', () => {
    it('appends a youtube video to last assistant message', () => {
      useChatStore.getState().appendYoutubeToLastMessage({
        videoId: 'abc123def45',
        title: 'Negroni Tutorial',
        thumbnail: 'http://img.com/thumb.jpg',
      });
      const msgs = useChatStore.getState().messages;
      const last = msgs[msgs.length - 1];
      expect(last.youtubeVideos).toHaveLength(1);
      expect(last.youtubeVideos![0].videoId).toBe('abc123def45');
    });

    it('deduplicates by videoId', () => {
      const store = useChatStore.getState();
      store.appendYoutubeToLastMessage({ videoId: 'abc123def45', title: 'A', thumbnail: '' });
      store.appendYoutubeToLastMessage({ videoId: 'abc123def45', title: 'B', thumbnail: '' });
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].youtubeVideos).toHaveLength(1);
    });

    it('does nothing when last message is a user message', () => {
      useChatStore.getState().addMessage({ id: 'u1', role: 'user', content: 'hi', timestamp: new Date() });
      useChatStore.getState().appendYoutubeToLastMessage({ videoId: 'x', title: '', thumbnail: '' });
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].youtubeVideos).toBeUndefined();
    });
  });

  describe('appendAddButtonToLastMessage', () => {
    it('appends an add button to last assistant message', () => {
      useChatStore.getState().appendAddButtonToLastMessage({
        cocktailName: 'Negroni',
        recipeData: { ingredients: ['gin'] },
      });
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].addButtons).toHaveLength(1);
      expect(msgs[msgs.length - 1].addButtons![0].cocktailName).toBe('Negroni');
    });

    it('deduplicates by cocktailName', () => {
      const store = useChatStore.getState();
      store.appendAddButtonToLastMessage({ cocktailName: 'Negroni', recipeData: {} });
      store.appendAddButtonToLastMessage({ cocktailName: 'Negroni', recipeData: { x: 1 } });
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].addButtons).toHaveLength(1);
    });

    it('does nothing when last message is a user message', () => {
      useChatStore.getState().addMessage({ id: 'u1', role: 'user', content: 'hi', timestamp: new Date() });
      useChatStore.getState().appendAddButtonToLastMessage({ cocktailName: 'X', recipeData: {} });
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].addButtons).toBeUndefined();
    });
  });

  describe('markLastMessageDone', () => {
    it('marks last assistant message as not streaming', () => {
      useChatStore.getState().addMessage({ id: 'a1', role: 'assistant', content: 'Hello', timestamp: new Date(), isStreaming: true });
      useChatStore.getState().markLastMessageDone();
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].isStreaming).toBe(false);
    });

    it('does nothing when last message is not assistant', () => {
      useChatStore.getState().addMessage({ id: 'u1', role: 'user', content: 'hi', timestamp: new Date() });
      useChatStore.getState().markLastMessageDone();
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].role).toBe('user');
    });
  });

  describe('appendWhereToBuyToLastMessage', () => {
    it('sets where-to-buy cards on last assistant message', () => {
      useChatStore.getState().appendWhereToBuyToLastMessage('Hendricks Gin', [
        { store: 'Drizly', priceRange: '$30-40', deliveryNote: '1-2 days', url: 'http://d.com', logo: '', type: 'online' },
      ]);
      const msgs = useChatStore.getState().messages;
      const last = msgs[msgs.length - 1];
      expect(last.whereToBuyCards?.ingredientName).toBe('Hendricks Gin');
      expect(last.whereToBuyCards?.results).toHaveLength(1);
    });

    it('does nothing when last message is a user message', () => {
      useChatStore.getState().addMessage({ id: 'u1', role: 'user', content: 'hi', timestamp: new Date() });
      useChatStore.getState().appendWhereToBuyToLastMessage('Gin', []);
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].whereToBuyCards).toBeUndefined();
    });
  });
});
