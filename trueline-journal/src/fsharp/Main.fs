/// Trueline Journal — F# entry module. Exposes a one-call summary used by the
/// dashboard plus a smoke-test hook the app logs at startup to prove the
/// Fable pipeline is wired up.
module Main

let version = "0.1.0"

let hello () =
    sprintf "Trueline F# core v%s loaded (Fable)" version

/// Aggregate summary computed in one pass for the dashboard header cards.
let summarize (pnls: float[]) (rs: float[]) (dailyPnls: float[]) (hasStops: bool[]) =
    {| netPnl = Array.sum pnls
       totalTrades = pnls.Length
       winRate = Metrics.calcWinRate pnls
       profitFactor = Metrics.calcProfitFactor pnls
       expectancy = Metrics.calcExpectancy pnls
       avgR = Metrics.calcAvgR rs
       edgeScore = Metrics.calcEdgeScore pnls rs dailyPnls hasStops |}
