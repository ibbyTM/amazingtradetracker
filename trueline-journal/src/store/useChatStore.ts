import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

interface ChatState {
  isOpen: boolean
  isLoading: boolean
  messages: ChatMessage[]
  setOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  addMessage: (role: ChatMessage['role'], content: string) => void
}

// Session-only chat history — intentionally NOT persisted; clears on refresh.
export const useChatStore = create<ChatState>()((set) => ({
  isOpen: false,
  isLoading: false,
  messages: [],
  setOpen: (isOpen) => set({ isOpen }),
  setLoading: (isLoading) => set({ isLoading }),
  addMessage: (role, content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role, content, ts: Date.now() },
      ],
    })),
}))
