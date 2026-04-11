import { create } from "zustand";
import type { ChatMessage, GuardianIntent } from "@/lib/types";

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  addUserMessage: (content: string) => string;
  addGuardianMessage: (content: string, intent?: GuardianIntent) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  addUserMessage: (content) => {
    const id = generateId();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
    return id;
  },

  addGuardianMessage: (content, intent) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role: "guardian",
          content,
          intent,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),
}));
