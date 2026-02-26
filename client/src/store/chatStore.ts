import { create } from "zustand";
import type { ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentAgentName: string | null;

  addMessage: (msg: ChatMessage) => void;
  appendTokenToLastMessage: (token: string) => void;
  markLastMessageDone: () => void;
  setCurrentAgent: (name: string | null) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hey there! I'm **Mixologist**, your personal cocktail guide.\n\nAsk me anything — from classic recipes to what to make with what's in your bar. What are you in the mood for?",
      timestamp: new Date(),
      agentName: "Mixologist",
      suggestions: [
        "🍸 What can I make with vodka?",
        "🥃 Recommend a whiskey cocktail",
        "🍹 Surprise me with something tropical",
        "🍋 What goes well with gin and citrus?",
      ],
    },
  ],
  isStreaming: false,
  currentAgentName: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  appendTokenToLastMessage: (token) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + token };
      }
      return { messages: msgs };
    }),

  markLastMessageDone: () =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, isStreaming: false };
      }
      return { messages: msgs };
    }),

  setCurrentAgent: (name) => set({ currentAgentName: name }),
  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [] }),
}));
