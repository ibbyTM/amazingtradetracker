/// Trueline Journal — core trading metrics, compiled to JS by Fable.
/// All functions are defensive against empty arrays: they return 0 (or a
/// neutral value) rather than throwing, so the UI never breaks on no data.
module Metrics

open System

let private clamp lo hi (v: float) = max lo (min hi v)

let private mean (xs: float[]) =
    if xs.Length = 0 then 0.0 else Array.average xs

/// Sample standard deviation. 0 for fewer than two samples.
let private stdDev (xs: float[]) =
    if xs.Length < 2 then 0.0
    else
        let m = mean xs
        let variance = (xs |> Array.sumBy (fun x -> (x - m) * (x - m))) / float (xs.Length - 1)
        sqrt variance

/// Wins / total trades, as a percentage 0–100.
let calcWinRate (pnls: float[]) : float =
    if pnls.Length = 0 then 0.0
    else
        let wins = pnls |> Array.filter (fun p -> p > 0.0) |> Array.length
        float wins / float pnls.Length * 100.0

/// Gross wins / gross losses. 0 with no trades; capped at 99 when there are
/// wins but no losses yet (an "infinite" profit factor).
let calcProfitFactor (pnls: float[]) : float =
    if pnls.Length = 0 then 0.0
    else
        let grossWins = pnls |> Array.filter (fun p -> p > 0.0) |> Array.sum
        let grossLosses = pnls |> Array.filter (fun p -> p < 0.0) |> Array.sumBy abs
        if grossLosses = 0.0 then (if grossWins > 0.0 then 99.0 else 0.0)
        else grossWins / grossLosses

/// (winRate × avgWin) − (lossRate × avgLoss): expected dollars per trade.
let calcExpectancy (pnls: float[]) : float =
    if pnls.Length = 0 then 0.0
    else
        let wins = pnls |> Array.filter (fun p -> p > 0.0)
        let losses = pnls |> Array.filter (fun p -> p < 0.0)
        let winRate = float wins.Length / float pnls.Length
        let lossRate = float losses.Length / float pnls.Length
        let avgWin = if wins.Length = 0 then 0.0 else Array.average wins
        let avgLoss = if losses.Length = 0 then 0.0 else losses |> Array.averageBy abs
        winRate * avgWin - lossRate * avgLoss

/// Average R multiple across all trades.
let calcAvgR (rs: float[]) : float =
    if rs.Length = 0 then 0.0 else Array.average rs

/// Kelly fraction as a suggested position-size percentage, clamped to 0–100.
/// winRatePct is 0–100; avgWin/avgLoss are positive dollar magnitudes.
let calcKelly (winRatePct: float) (avgWin: float) (avgLoss: float) : float =
    if avgWin <= 0.0 || avgLoss <= 0.0 then 0.0
    else
        let p = winRatePct / 100.0
        let q = 1.0 - p
        let b = avgWin / avgLoss
        let kelly = (p * b - q) / b
        clamp 0.0 100.0 (kelly * 100.0)

/// Streaks from trade results ordered oldest → newest.
/// Results are "win" | "loss" | "be". `current` is positive for an active win
/// streak, negative for an active loss streak, 0 after a break-even trade.
let calcStreaks (results: string[]) =
    let mutable run = 0
    let mutable longestWin = 0
    let mutable longestLoss = 0
    for r in results do
        match r with
        | "win" ->
            run <- if run > 0 then run + 1 else 1
            longestWin <- max longestWin run
        | "loss" ->
            run <- if run < 0 then run - 1 else -1
            longestLoss <- max longestLoss (abs run)
        | _ -> run <- 0
    {| current = run; longestWin = longestWin; longestLoss = longestLoss |}

/// Consistency of daily P&L, normalised to 0–100 (higher = steadier days).
/// Based on the ratio of the standard deviation of daily P&L to the average
/// absolute daily P&L — a ratio of 0 scores 100, a ratio of 4+ scores 0.
let calcConsistency (dailyPnls: float[]) : float =
    if dailyPnls.Length = 0 then 0.0
    elif dailyPnls.Length = 1 then 50.0
    else
        let sd = stdDev dailyPnls
        let avgAbs = dailyPnls |> Array.averageBy abs
        if avgAbs = 0.0 then 50.0
        else clamp 0.0 100.0 (100.0 - (sd / avgAbs) * 25.0)

/// Percentage of trades that had a stop in place.
let calcRiskMgmt (hasStops: bool[]) : float =
    if hasStops.Length = 0 then 0.0
    else
        let withStop = hasStops |> Array.filter id |> Array.length
        float withStop / float hasStops.Length * 100.0

/// Discipline 0–100: half from stop usage, half from not letting losers run
/// past -1.5R (i.e. honoring the planned stop).
let calcDiscipline (hasStops: bool[]) (rs: float[]) : float =
    if hasStops.Length = 0 then 0.0
    else
        let stopScore = calcRiskMgmt hasStops
        let withinRisk =
            if rs.Length = 0 then 100.0
            else
                let ok = rs |> Array.filter (fun r -> r > -1.5) |> Array.length
                float ok / float rs.Length * 100.0
        stopScore * 0.5 + withinRisk * 0.5

/// R multiple for a single trade. Longs: (exit − entry) / (entry − stop);
/// shorts: (entry − exit) / (stop − entry). 0 when the stop gives no risk.
let calcRMultiple (side: string) (entry: float) (stop: float) (exit: float) : float =
    let risk = if side = "SHORT" then stop - entry else entry - stop
    if risk <= 0.0 then 0.0
    else
        let reward = if side = "SHORT" then entry - exit else exit - entry
        reward / risk

/// Points captured for a single trade (signed, per contract).
let calcPoints (side: string) (entry: float) (exit: float) : float =
    if side = "SHORT" then entry - exit else exit - entry

/// Dollar P&L: points × $-per-point × contracts.
let calcTradePnl (side: string) (entry: float) (exit: float) (size: float) (pointValue: float) : float =
    calcPoints side entry exit * pointValue * size

// --- Edge score -------------------------------------------------------------

// Raw metrics normalised onto 0–100 scales for scoring/radar display.
// 65% win rate, 2.5 profit factor and +2R average are treated as "perfect".
let private scoreWinRate wr = clamp 0.0 100.0 (wr / 65.0 * 100.0)
let private scoreProfitFactor pf = clamp 0.0 100.0 (pf / 2.5 * 100.0)
let private scoreAvgR r = clamp 0.0 100.0 ((r + 0.5) / 2.5 * 100.0)

/// Per-axis 0–100 scores used by the Edge Breakdown radar chart.
let calcEdgeBreakdown (pnls: float[]) (rs: float[]) (dailyPnls: float[]) (hasStops: bool[]) =
    {| winRate = scoreWinRate (calcWinRate pnls)
       profitFactor = scoreProfitFactor (calcProfitFactor pnls)
       avgR = scoreAvgR (calcAvgR rs)
       consistency = calcConsistency dailyPnls
       riskMgmt = calcRiskMgmt hasStops
       discipline = calcDiscipline hasStops rs |}

/// Weighted edge score 0–100: win rate 25%, profit factor 25%, avg R 20%,
/// consistency 20%, discipline 10%.
let calcEdgeScore (pnls: float[]) (rs: float[]) (dailyPnls: float[]) (hasStops: bool[]) : int =
    if pnls.Length = 0 then 0
    else
        let b = calcEdgeBreakdown pnls rs dailyPnls hasStops
        let score =
            b.winRate * 0.25
            + b.profitFactor * 0.25
            + b.avgR * 0.20
            + b.consistency * 0.20
            + b.discipline * 0.10
        int (Math.Round score)
