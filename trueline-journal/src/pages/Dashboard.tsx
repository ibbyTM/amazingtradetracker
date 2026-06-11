import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getSummary, edgeLabel, sortTrades } from '../lib/metrics'
import { fmtLongDate, fmtMoney, moneyClass, todayStr } from '../lib/format'
import { greeting, sessionStatus } from '../lib/markets'
import Donut from '../components/Donut'
import EquityCurve from '../components/EquityCurve'
import EdgeRadar from '../components/EdgeRadar'
import PnlCalendar from '../components/PnlCalendar'
import RecentTrades from '../components/RecentTrades'
import Guardrails from '../components/Guardrails'
import { useIsMobile } from '../lib/useIsMobile'

export default function Dashboard() {
  const trades = useStore((s) => s.trades)
  const accounts = useStore((s) => s.accounts)
  const settings = useStore((s) => s.settings)

  const summary = useMemo(() => getSummary(trades), [trades])
  const equitySeries = useMemo(() => {
    let cum = 0
    return sortTrades(trades).map((t) => (cum += t.pnl))
  }, [trades])
  const isEmpty = trades.length === 0 && accounts.length === 0

  const today = todayStr()
  const todayTrades = trades.filter((t) => t.date === today)
  const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0)
  const todayWins = todayTrades.filter((t) => t.pnl > 0).length
  const todayLosses = todayTrades.filter((t) => t.pnl < 0).length

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <header className="space-y-3 md:flex md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-lg font-bold md:text-xl">{greeting(settings.displayName)}</h1>
          <p className="text-xs text-text-muted md:text-sm">
            {fmtLongDate()} · <span className="text-accent-blue">{sessionStatus()}</span>
            {todayTrades.length > 0 && ` · ${todayTrades.length} trades captured today`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {summary.streaks.current > 0 && (
            <span className="badge shrink-0 bg-accent-yellow/10 px-3 py-1.5 text-accent-yellow">
              🔥 {summary.streaks.current} win streak
            </span>
          )}
          <Link to="/log" className="btn-primary flex-1 md:flex-none">
            + Log Trade
          </Link>
        </div>
      </header>

      {/* Empty-state welcome */}
      {isEmpty && (
        <div className="card card-purple flex flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-bold">Welcome to Trueline, {settings.displayName}.</h2>
          <p className="text-sm text-text-muted">
            Start by logging your first trade or adding your funded accounts.
          </p>
          <div className="flex gap-3">
            <Link to="/log" className="btn-primary">
              Log your first trade
            </Link>
            <Link to="/accounts" className="btn-ghost">
              Add an account
            </Link>
          </div>
        </div>
      )}

      {/* Stats cards — 2-col grid on mobile (Net P&L + Edge span both cols) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
        <div className="card card-green animate-fade-up overflow-hidden p-4 max-md:col-span-2">
          <Sparkline values={equitySeries} color="var(--accent-green)" />
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Net P&amp;L
            </div>
            <div className={`num mt-2 text-2xl font-bold md:text-3xl ${moneyClass(summary.netPnl)}`}>
              {fmtMoney(summary.netPnl)}
              <TrendArrow value={summary.netPnl} />
            </div>
            <div className="mt-1 text-xs text-text-muted">
              {summary.totalTrades > 0 ? `${summary.totalTrades} trades all-time` : 'No data yet'}
            </div>
          </div>
        </div>

        <DonutCard
          label="Win Rate"
          accent="card-green"
          value={summary.winRate}
          display={`${summary.winRate.toFixed(0)}%`}
          color="var(--accent-green)"
          sub={summary.totalTrades > 0 ? 'of all trades' : 'No data yet'}
        />
        <DonutCard
          label="Profit Factor"
          accent="card-blue"
          value={Math.min(summary.profitFactor, 3)}
          max={3}
          display={summary.profitFactor.toFixed(2)}
          color="var(--accent-blue)"
          sub={summary.totalTrades > 0 ? 'wins ÷ losses' : 'No data yet'}
        />

        <div className="card card-green animate-fade-up overflow-hidden p-4">
          <Sparkline values={equitySeries} color="var(--accent-purple)" />
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Expectancy
            </div>
            <div
              className={`num mt-2 text-2xl font-bold md:text-3xl ${moneyClass(summary.expectancy)}`}
            >
              {fmtMoney(summary.expectancy)}
              <TrendArrow value={summary.expectancy} />
            </div>
            <div className="mt-1 text-xs text-text-muted">
              {summary.totalTrades > 0 ? 'per trade' : 'No data yet'}
            </div>
          </div>
        </div>

        <DonutCard
          label="Edge Score"
          accent="card-purple max-md:col-span-2"
          value={summary.edgeScore}
          display={String(summary.edgeScore)}
          color="var(--accent-purple)"
          sub={edgeLabel(summary.edgeScore)}
        />
      </div>

      {/* Main grid. Mobile order: equity → today/edge/guardrails → calendar →
          recent. On xl the right panel occupies column 3 across all rows. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <EquityCurve trades={trades} />
        </div>

        {/* Right panel — Today → Edge breakdown → Prop guardrails */}
        <div className="space-y-4 xl:col-start-3 xl:row-start-1 xl:row-span-3">
          <div className="card card-blue animate-fade-up p-5">
            <h3 className="card-title mb-3">Today</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className={`num truncate text-xl font-bold ${moneyClass(todayPnl)}`}>
                  {fmtMoney(todayPnl, 0)}
                </div>
                <div className="text-xs text-text-muted">P&amp;L</div>
              </div>
              <div>
                <div className="num text-xl font-bold">{todayTrades.length}</div>
                <div className="text-xs text-text-muted">Trades</div>
              </div>
              <div>
                <div className="num text-xl font-bold">
                  <span className="text-accent-green">{todayWins}</span>
                  <span className="text-text-muted">/</span>
                  <span className="text-accent-red">{todayLosses}</span>
                </div>
                <div className="text-xs text-text-muted">W/L</div>
              </div>
            </div>
          </div>
          <EdgeRadar breakdown={summary.breakdown} score={summary.edgeScore} />
          <Guardrails accounts={accounts} trades={trades} />
        </div>

        <div className="xl:col-span-2 xl:col-start-1 xl:row-start-2">
          <PnlCalendar trades={trades} />
        </div>
        <div className="xl:col-span-2 xl:col-start-1 xl:row-start-3">
          <RecentTrades trades={trades} />
        </div>
      </div>
    </div>
  )
}

/** Small ▲/▼ next to a signed dollar metric. */
function TrendArrow({ value }: { value: number }) {
  if (value === 0) return null
  return (
    <span className={`ml-2 align-middle text-sm ${moneyClass(value)}`}>
      {value > 0 ? '▲' : '▼'}
    </span>
  )
}

/** Faint cumulative-P&L sparkline rendered behind a stat card. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const range = max - min || 1
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 100},${100 - ((v - min) / range) * 100}`,
    )
    .join(' ')
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 w-full opacity-[0.16]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function DonutCard({
  label,
  accent,
  value,
  max = 100,
  display,
  color,
  sub,
}: {
  label: string
  accent: string
  value: number
  max?: number
  display: string
  color: string
  sub: string
}) {
  const isMobile = useIsMobile()
  return (
    <div
      className={`card ${accent} animate-fade-up flex items-center justify-between gap-3 overflow-hidden p-4`}
    >
      <div className="relative min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </div>
        <div className="num mt-2 text-2xl font-bold md:text-3xl" style={{ color }}>
          {display}
        </div>
        <div className="mt-1 truncate text-xs text-text-muted">{sub}</div>
      </div>
      <Donut value={value} max={max} color={color} size={isMobile ? 48 : 60} />
    </div>
  )
}
