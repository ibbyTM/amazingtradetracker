export type SymbolCode = 'NQ' | 'ES' | 'MNQ' | 'MES' | 'CL' | 'GC' | 'other'
export type Side = 'LONG' | 'SHORT'
export type Platform = 'Tradovate' | 'Topstep' | 'Apex' | 'Bulenox' | 'Tradeday' | 'other'
export type Bias = 'Bullish' | 'Bearish' | 'Neutral'

export interface Trade {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  symbol: SymbolCode
  side: Side
  setup: string
  size: number
  entryPrice: number
  exitPrice: number
  stopPrice: number
  duration: string
  pnl: number
  rMultiple: number
  notes: string
  screenshotUrl: string
  tags: string[]
  accountId: string
}

export interface Account {
  id: string
  name: string
  platform: Platform
  accountSize: number
  dailyLossLimit: number
  trailingDDLimit: number
  startingBalance: number
  currentBalance: number
}

export interface DailyEntry {
  date: string
  bias: Bias
  keyLevels: string
  mentalState: number // 1–5
  gamePlan: string
  whatWentWell: string
  mistakes: string
  lesson: string
}

export type RCalcMethod = 'fixed' | 'atr'

export interface Settings {
  displayName: string
  defaultSymbol: SymbolCode
  tickValues: Record<SymbolCode, number>
  rCalcMethod: RCalcMethod
}
