import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      isChatOpen: true,
      pageContext: { type: null, id: null, name: null, summary: null },
      userId: 'user_placeholder',
    });
  });

  describe('chat panel visibility', () => {
    it('starts open by default', () => {
      expect(useUIStore.getState().isChatOpen).toBe(true);
    });

    it('toggleChat flips the state', () => {
      useUIStore.getState().toggleChat();
      expect(useUIStore.getState().isChatOpen).toBe(false);
      useUIStore.getState().toggleChat();
      expect(useUIStore.getState().isChatOpen).toBe(true);
    });

    it('openChat sets to true', () => {
      useUIStore.getState().closeChat();
      useUIStore.getState().openChat();
      expect(useUIStore.getState().isChatOpen).toBe(true);
    });

    it('closeChat sets to false', () => {
      useUIStore.getState().closeChat();
      expect(useUIStore.getState().isChatOpen).toBe(false);
    });
  });

  describe('pageContext', () => {
    it('starts with null context', () => {
      const ctx = useUIStore.getState().pageContext;
      expect(ctx.type).toBeNull();
      expect(ctx.id).toBeNull();
      expect(ctx.name).toBeNull();
      expect(ctx.summary).toBeNull();
    });

    it('setPageContext updates context', () => {
      useUIStore.getState().setPageContext({
        type: 'spirit',
        id: 1,
        name: 'Hendricks Gin',
        summary: 'Premium gin',
      });
      const ctx = useUIStore.getState().pageContext;
      expect(ctx.type).toBe('spirit');
      expect(ctx.id).toBe(1);
      expect(ctx.name).toBe('Hendricks Gin');
    });

    it('clearPageContext resets context', () => {
      useUIStore.getState().setPageContext({
        type: 'recipe',
        id: 5,
        name: 'Negroni',
        summary: 'Classic',
      });
      useUIStore.getState().clearPageContext();
      const ctx = useUIStore.getState().pageContext;
      expect(ctx.type).toBeNull();
      expect(ctx.id).toBeNull();
    });
  });

  it('has a userId', () => {
    expect(useUIStore.getState().userId).toBe('user_placeholder');
  });

  describe('pendingChatMessage', () => {
    it('starts null', () => {
      expect(useUIStore.getState().pendingChatMessage).toBeNull();
    });

    it('openChatWithMessage sets isChatOpen and pendingChatMessage', () => {
      useUIStore.getState().closeChat();
      useUIStore.getState().openChatWithMessage('Make me a mojito');
      expect(useUIStore.getState().isChatOpen).toBe(true);
      expect(useUIStore.getState().pendingChatMessage).toBe('Make me a mojito');
    });

    it('clearPendingChatMessage sets to null', () => {
      useUIStore.getState().openChatWithMessage('test');
      useUIStore.getState().clearPendingChatMessage();
      expect(useUIStore.getState().pendingChatMessage).toBeNull();
    });
  });

  describe('recipeYouTubeOverrides', () => {
    it('starts empty', () => {
      expect(useUIStore.getState().recipeYouTubeOverrides).toEqual({});
    });

    it('setRecipeYouTubeOverride stores videoId by recipeId', () => {
      useUIStore.getState().setRecipeYouTubeOverride(7, 'abc123def45');
      expect(useUIStore.getState().recipeYouTubeOverrides[7]).toBe('abc123def45');
    });

    it('merges multiple overrides', () => {
      useUIStore.getState().setRecipeYouTubeOverride(7, 'vid1');
      useUIStore.getState().setRecipeYouTubeOverride(8, 'vid2');
      expect(useUIStore.getState().recipeYouTubeOverrides).toEqual({ 7: 'vid1', 8: 'vid2' });
    });
  });

  describe('whereToBuyResults', () => {
    it('starts empty', () => {
      expect(useUIStore.getState().whereToBuyResults).toEqual({});
    });

    it('setWhereToBuyResults stores results keyed by lowercase name', () => {
      useUIStore.getState().setWhereToBuyResults('Hendricks Gin', 1, [
        { store: 'Drizly', priceRange: '$30', deliveryNote: '1 day', url: 'http://d.com', logo: '', type: 'online' },
      ]);
      const entry = useUIStore.getState().whereToBuyResults['hendricks gin'];
      expect(entry.bottleId).toBe(1);
      expect(entry.results).toHaveLength(1);
    });

    it('getWhereToBuyResults returns null (placeholder implementation)', () => {
      const result = useUIStore.getState().getWhereToBuyResults('anything');
      expect(result).toBeNull();
    });
  });
});
