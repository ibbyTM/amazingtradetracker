import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Trade } from '../store/types'
import { sortTrades } from '../lib/metrics'
import { fmtMoney, fmtR, moneyClass } from '../lib/format'
import { SYMBOL_COLORS } from '../lib/markets'

export default function RecentTrades({ trades }: { trades: Trade[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const recent = sortTrades(trades).slice(-10).reverse()

  return (
    <div className="card animate-fade-up p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Recent Trades
        </h3>
        <Link to="/trades" className="text-xs font-semibold text-accent-purple hover:underline">
          View all trades →
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-text-muted">No trades logged yet. Hit + Log Trade to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="th">Time</th>
                <th className="th">Symbol</th>
                <th className="th">Side</th>
                <th className="th">Setup</th>
                <th className="th text-right">Size</th>
                <th className="th">Duration</th>
                <th className="th text-right">R</th>
                <th className="th text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <RowGroup
                  key={t.id}
                  trade={t}
                  expanded={expanded === t.id}
                  onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RowGroup({
  trade: t,
  expanded,
  onToggle,
}: {
  trade: Trade
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/50 transition-colors hover:bg-bg-hover"
        onClick={onToggle}
      >
        <td className="td num text-text-muted">
          {t.date.slice(5)} {t.time}
        </td>
        <td className="td">
          <span className={`badge ${SYMBOL_COLORS[t.symbol]}`}>{t.symbol}</span>
        </td>
        <td className="td">
          <span
            className={`badge ${
              t.side === 'LONG'
                ? 'bg-accent-green/15 text-accent-green'
                : 'bg-accent-red/15 text-accent-red'
            }`}
          >
            {t.side}
          </span>
        </td>
        <td className="td">{t.setup || '—'}</td>
        <td className="td num text-right">{t.size}</td>
        <td className="td num text-text-muted">{t.duration || '—'}</td>
        <td className={`td num text-right ${moneyClass(t.rMultiple)}`}>{fmtR(t.rMultiple)}</td>
        <td className={`td num text-right font-semibold ${moneyClass(t.pnl)}`}>
          {fmtMoney(t.pnl)}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/50 bg-bg-primary/60">
          <td colSpan={8} className="px-4 py-3 text-sm">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div>
                <span className="text-text-muted">Entry </span>
                <span className="num">{t.entryPrice}</span>
              </div>
              <div>
                <span className="text-text-muted">Exit </span>
                <span className="num">{t.exitPrice}</span>
              </div>
              <div>
                <span className="text-text-muted">Stop </span>
                <span className="num">{t.stopPrice || '—'}</span>
              </div>
              <div>
                <span className="text-text-muted">Tags </span>
                {t.tags.length ? t.tags.join(', ') : '—'}
              </div>
            </div>
            {t.notes && <p className="mt-2 text-text-muted">{t.notes}</p>}
          </td>
        </tr>
      )}
    </>
  )
}
