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
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">{greeting(settings.displayName)}</h1>
          <p className="text-sm text-text-muted">
            {fmtLongDate()} · <span className="text-accent-blue">{sessionStatus()}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {summary.streaks.current > 0 && (
            <span className="badge bg-accent-green/15 px-3 py-1.5 text-accent-green">
              🔥 {summary.streaks.current} win streak
            </span>
          )}
          <Link to="/log" className="btn-green">
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

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <div className="card card-green animate-fade-up overflow-hidden p-4">
          <Sparkline values={equitySeries} />
          <span className="watermark -bottom-5 -right-2 text-8xl">$</span>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Net P&amp;L
            </div>
            <div className={`num mt-2 text-3xl font-bold ${moneyClass(summary.netPnl)}`}>
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
          watermark="%"
          value={summary.winRate}
          display={`${summary.winRate.toFixed(0)}%`}
          color="var(--accent-green)"
          sub={summary.totalTrades > 0 ? 'of all trades' : 'No data yet'}
        />
        <DonutCard
          label="Profit Factor"
          accent="card-blue"
          watermark="×"
          value={Math.min(summary.profitFactor, 3)}
          max={3}
          display={summary.profitFactor.toFixed(2)}
          color="var(--accent-blue)"
          sub={summary.totalTrades > 0 ? 'wins ÷ losses' : 'No data yet'}
        />

        <div className="card card-green animate-fade-up overflow-hidden p-4">
          <span className="watermark -bottom-5 -right-2 text-8xl">Σ</span>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Expectancy
            </div>
            <div className={`num mt-2 text-3xl font-bold ${moneyClass(summary.expectancy)}`}>
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
          accent="card-purple"
          watermark="★"
          value={summary.edgeScore}
          display={String(summary.edgeScore)}
          color="var(--accent-purple)"
          sub={edgeLabel(summary.edgeScore)}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <EquityCurve trades={trades} />
          <PnlCalendar trades={trades} />
          <RecentTrades trades={trades} />
        </div>

        {/* Right panel — Today → Prop Guardrails → Edge Breakdown */}
        <div className="space-y-4">
          <div className="card card-blue animate-fade-up p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
              Today
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className={`num text-xl font-bold ${moneyClass(todayPnl)}`}>
                  {fmtMoney(todayPnl, 0)}
                </div>
                <div className="text-[11px] text-text-muted">P&amp;L</div>
              </div>
              <div>
                <div className="num text-xl font-bold">{todayTrades.length}</div>
                <div className="text-[11px] text-text-muted">Trades</div>
              </div>
              <div>
                <div className="num text-xl font-bold">
                  <span className="text-accent-green">{todayWins}</span>
                  <span className="text-text-muted">/</span>
                  <span className="text-accent-red">{todayLosses}</span>
                </div>
                <div className="text-[11px] text-text-muted">W/L</div>
              </div>
            </div>
          </div>
          <Guardrails accounts={accounts} trades={trades} />
          <EdgeRadar breakdown={summary.breakdown} score={summary.edgeScore} />
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

/** Faint cumulative-P&L sparkline rendered behind the Net P&L card. */
function Sparkline({ values }: { values: number[] }) {
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
      className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 w-full opacity-[0.14]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent-green)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function DonutCard({
  label,
  accent,
  watermark,
  value,
  max = 100,
  display,
  color,
  sub,
}: {
  label: string
  accent: string
  watermark: string
  value: number
  max?: number
  display: string
  color: string
  sub: string
}) {
  return (
    <div className={`card ${accent} animate-fade-up flex items-center gap-4 overflow-hidden p-4`}>
      <span className="watermark -bottom-5 -right-2 text-8xl">{watermark}</span>
      <Donut value={value} max={max} color={color}>
        <span className="num text-base font-bold">{display}</span>
      </Donut>
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </div>
        <div className="mt-1 text-xs text-text-muted">{sub}</div>
      </div>
    </div>
  )
}
