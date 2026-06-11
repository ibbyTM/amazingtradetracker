import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getSummary, edgeLabel } from '../lib/metrics'
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
        <div className="card flex flex-col items-start gap-3 border-accent-purple/40 p-6">
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
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Net P&amp;L
          </div>
          <div className={`num mt-2 text-2xl font-bold ${moneyClass(summary.netPnl)}`}>
            {fmtMoney(summary.netPnl)}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {summary.totalTrades > 0 ? `${summary.totalTrades} trades all-time` : 'No data yet'}
          </div>
        </div>

        <DonutCard
          label="Win Rate"
          value={summary.winRate}
          display={`${summary.winRate.toFixed(0)}%`}
          color="var(--accent-green)"
          sub={summary.totalTrades > 0 ? 'of all trades' : 'No data yet'}
        />
        <DonutCard
          label="Profit Factor"
          value={Math.min(summary.profitFactor, 3)}
          max={3}
          display={summary.profitFactor.toFixed(2)}
          color="var(--accent-blue)"
          sub={summary.totalTrades > 0 ? 'wins ÷ losses' : 'No data yet'}
        />

        <div className="card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Expectancy
          </div>
          <div className={`num mt-2 text-2xl font-bold ${moneyClass(summary.expectancy)}`}>
            {fmtMoney(summary.expectancy)}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {summary.totalTrades > 0 ? 'per trade' : 'No data yet'}
          </div>
        </div>

        <DonutCard
          label="Edge Score"
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
          <EdgeRadar breakdown={summary.breakdown} score={summary.edgeScore} />
          <RecentTrades trades={trades} />
        </div>

        {/* Right panel — Today */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
              Today
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className={`num text-lg font-bold ${moneyClass(todayPnl)}`}>
                  {fmtMoney(todayPnl, 0)}
                </div>
                <div className="text-[11px] text-text-muted">P&amp;L</div>
              </div>
              <div>
                <div className="num text-lg font-bold">{todayTrades.length}</div>
                <div className="text-[11px] text-text-muted">Trades</div>
              </div>
              <div>
                <div className="num text-lg font-bold">
                  <span className="text-accent-green">{todayWins}</span>
                  <span className="text-text-muted">/</span>
                  <span className="text-accent-red">{todayLosses}</span>
                </div>
                <div className="text-[11px] text-text-muted">W/L</div>
              </div>
            </div>
          </div>
          <Guardrails accounts={accounts} trades={trades} />
        </div>
      </div>
    </div>
  )
}

function DonutCard({
  label,
  value,
  max = 100,
  display,
  color,
  sub,
}: {
  label: string
  value: number
  max?: number
  display: string
  color: string
  sub: string
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <Donut value={value} max={max} color={color}>
        <span className="num text-sm font-bold">{display}</span>
      </Donut>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </div>
        <div className="mt-1 text-xs text-text-muted">{sub}</div>
      </div>
    </div>
  )
}
