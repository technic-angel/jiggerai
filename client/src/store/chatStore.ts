import { create } from "zustand";
import type { ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentAgentName: string;

  addMessage: (msg: ChatMessage) => void;
  appendTokenToLastMessage: (token: string) => void;
  setCurrentAgent: (name: string) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: "mock-1",
      role: "user",
      content: "What can I make with gin and lime?",
      timestamp: new Date(),
    },
    {
      id: "mock-2",
      role: "assistant",
      content:
        "**Gimlet**\n\nPresence: a classic cocktail recipe that uses gin and lime.\n\n**Ingredients:**\n- 1 oz gimlet\n- 1 oz gin and limes\n- 1 tsp potter\n- 1 cup softness with lime\n\n**Instructions:**\n1. Add gin and lime juice to a shaker with ice\n2. Shake until well-chilled\n3. Strain into a coupe glass\n4. Garnish with a lime wheel\n\nhttps://www.youtube.com/watch?v=GinGimlet",
      timestamp: new Date(),
      agentName: "Mixologist Agent",
    },
  ],
  isStreaming: false,
  currentAgentName: "Mixologist Agent",

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

  setCurrentAgent: (name) => set({ currentAgentName: name }),
  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [] }),
}));
