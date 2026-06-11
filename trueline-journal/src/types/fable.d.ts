// Hand-written ambient typings for the JS modules Fable emits from
// src/fsharp/*.fs. The '@fable' alias is defined in vite.config.ts and points
// at the compiled output (src/fsharp/build/src/fsharp). Keep in sync with F#.

declare module '@fable/Metrics.js' {
  export interface Streaks {
    current: number
    longestWin: number
    longestLoss: number
  }

  export interface EdgeBreakdown {
    winRate: number
    profitFactor: number
    avgR: number
    consistency: number
    riskMgmt: number
    discipline: number
  }

  export function calcWinRate(pnls: number[]): number
  export function calcProfitFactor(pnls: number[]): number
  export function calcExpectancy(pnls: number[]): number
  export function calcAvgR(rs: number[]): number
  export function calcKelly(winRatePct: number, avgWin: number, avgLoss: number): number
  export function calcStreaks(results: string[]): Streaks
  export function calcConsistency(dailyPnls: number[]): number
  export function calcRiskMgmt(hasStops: boolean[]): number
  export function calcDiscipline(hasStops: boolean[], rs: number[]): number
  export function calcRMultiple(side: string, entry: number, stop: number, exit: number): number
  export function calcPoints(side: string, entry: number, exit: number): number
  export function calcTradePnl(
    side: string,
    entry: number,
    exit: number,
    size: number,
    pointValue: number,
  ): number
  export function calcEdgeBreakdown(
    pnls: number[],
    rs: number[],
    dailyPnls: number[],
    hasStops: boolean[],
  ): EdgeBreakdown
  export function calcEdgeScore(
    pnls: number[],
    rs: number[],
    dailyPnls: number[],
    hasStops: boolean[],
  ): number
}

declare module '@fable/Main.js' {
  export interface Summary {
    netPnl: number
    totalTrades: number
    winRate: number
    profitFactor: number
    expectancy: number
    avgR: number
    edgeScore: number
  }

  export const version: string
  export function hello(): string
  export function summarize(
    pnls: number[],
    rs: number[],
    dailyPnls: number[],
    hasStops: boolean[],
  ): Summary
}
