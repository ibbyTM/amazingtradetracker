import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
  kind: 'success' | 'error' | 'info'
}

interface ToastState {
  toasts: ToastItem[]
  push: (message: string, kind?: ToastItem['kind']) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, kind = 'success') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }))
    window.setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      2800,
    )
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Fire-and-forget toast from anywhere (components, stores, libs). */
export const toast = (message: string, kind?: ToastItem['kind']) =>
  useToastStore.getState().push(message, kind)
