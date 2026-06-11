// Thin TS wrapper over the F#/Fable computation layer. All math lives in
// src/fsharp/Metrics.fs — this file only shapes Trade[] into the primitive
// arrays the F# functions take.
import * as M from '@fable/Metrics.js'
import type { EdgeBreakdown, Streaks } from '@fable/Metrics.js'
import { summarize } from '@fable/Main.js'
import type { Summary } from '@fable/Main.js'
import type { Trade } from '../store/types'

export type { EdgeBreakdown, Streaks, Summary }
export const Metrics = M

export function sortTrades(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}

export interface MetricInputs {
  sorted: Trade[]
  pnls: number[]
  rs: number[]
  results: string[]
  hasStops: boolean[]
  dailyPnls: number[]
}

export function metricInputs(trades: Trade[]): MetricInputs {
  const sorted = sortTrades(trades)
  const daily = new Map<string, number>()
  for (const t of sorted) daily.set(t.date, (daily.get(t.date) ?? 0) + t.pnl)
  return {
    sorted,
    pnls: sorted.map((t) => t.pnl),
    rs: sorted.map((t) => t.rMultiple),
    results: sorted.map((t) => (t.pnl > 0 ? 'win' : t.pnl < 0 ? 'loss' : 'be')),
    hasStops: sorted.map((t) => t.stopPrice > 0),
    dailyPnls: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v),
  }
}

export interface FullSummary extends Summary {
  streaks: Streaks
  breakdown: EdgeBreakdown
  kelly: number
}

export function getSummary(trades: Trade[]): FullSummary {
  const i = metricInputs(trades)
  const summary = summarize(i.pnls, i.rs, i.dailyPnls, i.hasStops)
  const wins = i.pnls.filter((p) => p > 0)
  const losses = i.pnls.filter((p) => p < 0)
  const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
  const avgLoss = losses.length
    ? Math.abs(losses.reduce((a, b) => a + b, 0)) / losses.length
    : 0
  return {
    ...summary,
    streaks: M.calcStreaks(i.results),
    breakdown: M.calcEdgeBreakdown(i.pnls, i.rs, i.dailyPnls, i.hasStops),
    kelly: M.calcKelly(summary.winRate, avgWin, avgLoss),
  }
}

export function edgeLabel(score: number): string {
  if (score >= 85) return 'Elite'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Solid'
  if (score >= 40) return 'Developing'
  if (score > 0) return 'Early Days'
  return 'No Data'
}
