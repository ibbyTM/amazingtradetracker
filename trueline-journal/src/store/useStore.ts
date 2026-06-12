import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, DailyEntry, Settings, Trade } from './types'
import { DEFAULT_TICK_VALUES } from '../lib/markets'

export interface ExportedData {
  trades: Trade[]
  accounts: Account[]
  journal: DailyEntry[]
  settings: Settings
}

interface AppState extends ExportedData {
  addTrade: (trade: Trade) => void
  editTrade: (id: string, patch: Partial<Trade>) => void
  deleteTrade: (id: string) => void

  addAccount: (account: Account) => void
  editAccount: (id: string, patch: Partial<Account>) => void
  deleteAccount: (id: string) => void
  /** Eval passed: mark funded and restart balance tracking. */
  graduateAccount: (id: string) => void

  addJournalEntry: (entry: DailyEntry) => void
  editJournalEntry: (date: string, patch: Partial<DailyEntry>) => void

  updateSettings: (patch: Partial<Settings>) => void
  importData: (data: ExportedData) => void
  clearAll: () => void
}

const defaultSettings: Settings = {
  displayName: 'Chubs',
  defaultSymbol: 'NQ',
  tickValues: { ...DEFAULT_TICK_VALUES },
  rCalcMethod: 'fixed',
}

const emptyData: ExportedData = {
  trades: [],
  accounts: [],
  journal: [],
  settings: defaultSettings,
}

/** Apply a P&L delta to the account a trade belongs to. */
function applyToAccount(accounts: Account[], accountId: string, delta: number): Account[] {
  if (!accountId || delta === 0) return accounts
  return accounts.map((a) =>
    a.id === accountId ? { ...a, currentBalance: a.currentBalance + delta } : a,
  )
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...emptyData,

      addTrade: (trade) =>
        set((s) => ({
          trades: [...s.trades, trade],
          accounts: applyToAccount(s.accounts, trade.accountId, trade.pnl),
        })),

      editTrade: (id, patch) =>
        set((s) => {
          const old = s.trades.find((t) => t.id === id)
          if (!old) return s
          const next = { ...old, ...patch }
          // Reverse the old trade's effect on its account, apply the new one.
          let accounts = applyToAccount(s.accounts, old.accountId, -old.pnl)
          accounts = applyToAccount(accounts, next.accountId, next.pnl)
          return {
            trades: s.trades.map((t) => (t.id === id ? next : t)),
            accounts,
          }
        }),

      deleteTrade: (id) =>
        set((s) => {
          const old = s.trades.find((t) => t.id === id)
          return {
            trades: s.trades.filter((t) => t.id !== id),
            accounts: old ? applyToAccount(s.accounts, old.accountId, -old.pnl) : s.accounts,
          }
        }),

      addAccount: (account) => set((s) => ({ accounts: [...s.accounts, account] })),

      editAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      graduateAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id
              ? { ...a, stage: 'funded', currentBalance: a.startingBalance }
              : a,
          ),
        })),

      addJournalEntry: (entry) =>
        set((s) => ({
          journal: [...s.journal.filter((e) => e.date !== entry.date), entry],
        })),

      editJournalEntry: (date, patch) =>
        set((s) => ({
          journal: s.journal.map((e) => (e.date === date ? { ...e, ...patch } : e)),
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      importData: (data) =>
        set(() => ({
          trades: data.trades ?? [],
          // accounts saved before stages existed default to eval
          accounts: (data.accounts ?? []).map((a) => ({ ...a, stage: a.stage ?? 'eval' })),
          journal: data.journal ?? [],
          settings: { ...defaultSettings, ...data.settings },
        })),

      clearAll: () => set(() => ({ ...emptyData, settings: { ...defaultSettings } })),
    }),
    {
      name: 'trueline-journal',
      version: 1,
      migrate: (persisted) => {
        const s = persisted as ExportedData
        return {
          ...s,
          accounts: (s.accounts ?? []).map((a) => ({ ...a, stage: a.stage ?? 'eval' })),
        }
      },
    },
  ),
)
