import type { Settings, SymbolCode, Platform } from '../store/types'

export const SYMBOLS: SymbolCode[] = ['NQ', 'ES', 'MNQ', 'MES', 'CL', 'GC', 'other']
export const PLATFORMS: Platform[] = ['Tradovate', 'Topstep', 'Apex', 'Bulenox', 'Tradeday', 'other']

// $ per point per contract (editable in Settings).
export const DEFAULT_TICK_VALUES: Record<SymbolCode, number> = {
  NQ: 5,
  ES: 12.5,
  MNQ: 0.5,
  MES: 1.25,
  CL: 10,
  GC: 10,
  other: 1,
}

export const SYMBOL_COLORS: Record<SymbolCode, string> = {
  NQ: 'bg-accent-purple/20 text-accent-purple',
  ES: 'bg-accent-blue/20 text-accent-blue',
  MNQ: 'bg-accent-purple/10 text-accent-purple',
  MES: 'bg-accent-blue/10 text-accent-blue',
  CL: 'bg-accent-yellow/20 text-accent-yellow',
  GC: 'bg-accent-yellow/20 text-accent-yellow',
  other: 'bg-bg-hover text-text-muted',
}

export function pointValue(symbol: SymbolCode, settings: Settings): number {
  return settings.tickValues[symbol] ?? DEFAULT_TICK_VALUES[symbol] ?? 1
}

/** Trading session label from local time of day. */
export function sessionStatus(now = new Date()): string {
  const mins = now.getHours() * 60 + now.getMinutes()
  if (now.getDay() === 0 || now.getDay() === 6) return 'Closed · Weekend'
  if (mins >= 120 && mins < 480) return 'London'
  if (mins >= 480 && mins < 570) return 'Pre-market'
  if (mins >= 570 && mins < 960) return 'NY Open'
  return 'Closed'
}

export function greeting(name: string, now = new Date()): string {
  const h = now.getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${name}`
}
