import type { Account, Trade } from '../store/types'
import { sortTrades } from './metrics'
import { todayStr } from './format'

export interface AccountStatus {
  balance: number
  pnlDelta: number
  todayPnl: number
  dailyUsed: number
  dailyPct: number
  dailyRoom: number
  ddUsed: number
  ddPct: number
  ddRoom: number
}

export function accountStatus(account: Account, trades: Trade[]): AccountStatus {
  const accTrades = sortTrades(trades.filter((t) => t.accountId === account.id))
  const today = todayStr()
  const todayPnl = accTrades
    .filter((t) => t.date === today)
    .reduce((sum, t) => sum + t.pnl, 0)

  // Balance is the stored (independently editable) currentBalance; drawdown
  // is how far it sits below the starting balance.
  const balance = account.currentBalance
  const dailyUsed = Math.max(0, -todayPnl)
  const ddUsed = Math.max(0, account.startingBalance - balance)
  const pct = (used: number, limit: number) =>
    limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return {
    balance,
    pnlDelta: balance - account.startingBalance,
    todayPnl,
    dailyUsed,
    dailyPct: pct(dailyUsed, account.dailyLossLimit),
    dailyRoom: Math.max(0, account.dailyLossLimit - dailyUsed),
    ddUsed,
    ddPct: pct(ddUsed, account.trailingDDLimit),
    ddRoom: Math.max(0, account.trailingDDLimit - ddUsed),
  }
}

/** Green under 50%, yellow 50–80%, red over 80%. */
export function barColor(pct: number): string {
  if (pct > 80) return 'bg-accent-red'
  if (pct >= 50) return 'bg-accent-yellow'
  return 'bg-accent-green'
}
