import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AIMode = "chat" | "summarize" | "translate" | "code";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  streaming?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface PageContext {
  url: string;
  title: string;
  description?: string;
  textPreview?: string;
  headings?: string[];
}

interface AIState {
  conversations: Conversation[];
  activeConversationId: string | null;
  mode: AIMode;
  isThinking: boolean;
  currentPageContext: PageContext | null;

  newConversation: () => string;
  setActiveConversation: (id: string) => void;
  addMessage: (convId: string, msg: Omit<ChatMessage, "id" | "createdAt">) => string;
  appendToMessage: (convId: string, msgId: string, delta: string) => void;
  finishMessage: (convId: string, msgId: string, opts?: { error?: boolean }) => void;
  setMode: (m: AIMode) => void;
  setThinking: (v: boolean) => void;
  setPageContext: (ctx: PageContext | null) => void;
  renameConversation: (id: string, title: string) => void;
  clearConversation: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      mode: "chat",
      isThinking: false,
      currentPageContext: null,

      newConversation: () => {
        const c: Conversation = {
          id: uid(),
          title: "New chat",
          messages: [],
          createdAt: Date.now(),
        };
        set((s) => ({
          conversations: [c, ...s.conversations].slice(0, 30),
          activeConversationId: c.id,
        }));
        return c.id;
      },
      setActiveConversation: (id) => set({ activeConversationId: id }),
      addMessage: (convId, msg) => {
        const id = uid();
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, { ...msg, id, createdAt: Date.now() }] }
              : c
          ),
        }));
        return id;
      },
      appendToMessage: (convId, msgId, delta) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, content: m.content + delta } : m
                  ),
                }
              : c
          ),
        })),
      finishMessage: (convId, msgId, opts) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId
                      ? { ...m, streaming: false, error: opts?.error }
                      : m
                  ),
                }
              : c
          ),
        })),
      setMode: (m) => set({ mode: m }),
      setThinking: (v) => set({ isThinking: v }),
      setPageContext: (ctx) => set({ currentPageContext: ctx }),
      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        })),
      clearConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, messages: [] } : c
          ),
        })),
    }),
    {
      name: "nebula-ai",
      partialize: (s) => ({
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        mode: s.mode,
      }),
    }
  )
);
