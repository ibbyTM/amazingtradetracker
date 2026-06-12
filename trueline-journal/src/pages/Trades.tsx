import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { toast } from '../store/useToastStore'
import type { Trade, SymbolCode } from '../store/types'
import { SYMBOLS, SYMBOL_COLORS } from '../lib/markets'
import { fmtMoney, fmtPct, fmtR, moneyClass } from '../lib/format'
import { Metrics } from '../lib/metrics'

type SortKey = 'date' | 'symbol' | 'side' | 'setup' | 'size' | 'rMultiple' | 'pnl'
type Result = 'all' | 'win' | 'loss' | 'be'

const COLUMNS: { key: SortKey | string; label: string; sortable: boolean }[] = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'time', label: 'Time', sortable: false },
  { key: 'symbol', label: 'Symbol', sortable: true },
  { key: 'side', label: 'Side', sortable: true },
  { key: 'setup', label: 'Setup', sortable: true },
  { key: 'size', label: 'Size', sortable: true },
  { key: 'entryPrice', label: 'Entry', sortable: false },
  { key: 'exitPrice', label: 'Exit', sortable: false },
  { key: 'stopPrice', label: 'Stop', sortable: false },
  { key: 'rMultiple', label: 'R', sortable: true },
  { key: 'pnl', label: 'P&L', sortable: true },
  { key: 'account', label: 'Account', sortable: false },
]

export default function Trades() {
  const navigate = useNavigate()
  const { trades, accounts, deleteTrade } = useStore()

  const [symbols, setSymbols] = useState<SymbolCode[]>([])
  const [side, setSide] = useState<'all' | 'LONG' | 'SHORT'>('all')
  const [setupQuery, setSetupQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [result, setResult] = useState<Result>('all')
  const [accountId, setAccountId] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'date', dir: -1 })
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let out = trades.filter((t) => {
      if (symbols.length > 0 && !symbols.includes(t.symbol)) return false
      if (side !== 'all' && t.side !== side) return false
      if (setupQuery && !t.setup.toLowerCase().includes(setupQuery.toLowerCase())) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      if (result === 'win' && t.pnl <= 0) return false
      if (result === 'loss' && t.pnl >= 0) return false
      if (result === 'be' && t.pnl !== 0) return false
      if (accountId !== 'all' && t.accountId !== accountId) return false
      return true
    })
    out = [...out].sort((a, b) => {
      const { key, dir } = sort
      if (key === 'date') return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) * dir
      const av = a[key]
      const bv = b[key]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
    return out
  }, [trades, symbols, side, setupQuery, dateFrom, dateTo, result, accountId, sort])

  // Summary for the current filter — computed by the F# layer.
  const summary = useMemo(() => {
    const pnls = filtered.map((t) => t.pnl)
    const rs = filtered.map((t) => t.rMultiple)
    return {
      count: filtered.length,
      pnl: pnls.reduce((a, b) => a + b, 0),
      winRate: Metrics.calcWinRate(pnls),
      avgR: Metrics.calcAvgR(rs),
    }
  }, [filtered])

  function toggleSymbol(s: SymbolCode) {
    setSymbols((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  }

  function clickSort(key: SortKey) {
    setSort((cur) => (cur.key === key ? { key, dir: cur.dir === 1 ? -1 : 1 } : { key, dir: -1 }))
  }

  function exportCsv() {
    const header = [
      'date', 'time', 'symbol', 'side', 'setup', 'size', 'entryPrice', 'exitPrice',
      'stopPrice', 'duration', 'rMultiple', 'pnl', 'tags', 'account', 'notes',
    ]
    const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? ''
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const rows = filtered.map((t) =>
      [
        t.date, t.time, t.symbol, t.side, t.setup, t.size, t.entryPrice, t.exitPrice,
        t.stopPrice, t.duration, t.rMultiple, t.pnl, t.tags.join('|'),
        accountName(t.accountId), t.notes,
      ]
        .map(esc)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trueline-trades-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this trade? This cannot be undone.')) {
      deleteTrade(id)
      toast('Trade deleted', 'info')
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Trades</h1>
        <button
          className="btn-ghost max-md:w-full"
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          ⬇ Export CSV
        </button>
      </header>

      {/* Filter bar */}
      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSymbol(s)}
              className={`badge cursor-pointer px-2.5 py-1 transition-colors ${
                symbols.includes(s)
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-hover text-text-muted hover:text-text-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {/* mobile: side + result as horizontally scrollable pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          {(['all', 'LONG', 'SHORT'] as const).map((s) => (
            <FilterPill key={s} active={side === s} onClick={() => setSide(s)}>
              {s === 'all' ? 'All sides' : s}
            </FilterPill>
          ))}
          <span className="my-auto shrink-0 text-border">|</span>
          {(
            [
              ['all', 'All results'],
              ['win', 'Win'],
              ['loss', 'Loss'],
              ['be', 'BE'],
            ] as [Result, string][]
          ).map(([value, label]) => (
            <FilterPill key={value} active={result === value} onClick={() => setResult(value)}>
              {label}
            </FilterPill>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <select
            className="field max-md:hidden"
            value={side}
            onChange={(e) => setSide(e.target.value as typeof side)}
          >
            <option value="all">All sides</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
          <input
            className="field max-md:col-span-2"
            placeholder="Search setup…"
            value={setupQuery}
            onChange={(e) => setSetupQuery(e.target.value)}
          />
          <input type="date" className="field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <select
            className="field max-md:hidden"
            value={result}
            onChange={(e) => setResult(e.target.value as Result)}
          >
            <option value="all">All results</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="be">Break-even</option>
          </select>
          <select
            className="field max-md:col-span-2"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="card flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3 text-sm">
        <span>
          <span className="text-text-muted">Trades </span>
          <span className="num font-semibold">{summary.count}</span>
        </span>
        <span>
          <span className="text-text-muted">P&amp;L </span>
          <span className={`num font-semibold ${moneyClass(summary.pnl)}`}>
            {fmtMoney(summary.pnl)}
          </span>
        </span>
        <span>
          <span className="text-text-muted">Win rate </span>
          <span className="num font-semibold">{fmtPct(summary.winRate)}</span>
        </span>
        <span>
          <span className="text-text-muted">Avg R </span>
          <span className={`num font-semibold ${moneyClass(summary.avgR)}`}>
            {fmtR(summary.avgR)}
          </span>
        </span>
      </div>

      {/* Mobile: card list */}
      <div className="space-y-2 md:hidden">
        {filtered.length === 0 ? (
          <EmptyTrades anyTrades={trades.length > 0} />
        ) : (
          filtered.map((t) => (
            <MobileTradeCard
              key={t.id}
              trade={t}
              accountName={accounts.find((a) => a.id === t.accountId)?.name ?? '—'}
              expanded={expanded === t.id}
              onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
              onEdit={() => navigate(`/log?edit=${t.id}`)}
              onDelete={() => handleDelete(t.id)}
            />
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="card hidden overflow-x-auto md:block">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyTrades anyTrades={trades.length > 0} />
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={`th ${c.sortable ? 'cursor-pointer hover:text-text-primary' : ''}`}
                    onClick={() => c.sortable && clickSort(c.key as SortKey)}
                  >
                    {c.label}
                    {sort.key === c.key && (sort.dir === -1 ? ' ↓' : ' ↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <TradeRow
                  key={t.id}
                  trade={t}
                  accountName={accounts.find((a) => a.id === t.accountId)?.name ?? '—'}
                  expanded={expanded === t.id}
                  onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
                  onEdit={() => navigate(`/log?edit=${t.id}`)}
                  onDelete={() => handleDelete(t.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] shrink-0 rounded-full border px-4 text-xs font-semibold
        transition-colors ${
          active
            ? 'border-accent-purple bg-accent-purple/15 text-accent-purple'
            : 'border-border bg-bg-primary text-text-muted'
        }`}
    >
      {children}
    </button>
  )
}

function EmptyTrades({ anyTrades }: { anyTrades: boolean }) {
  return (
    <div className="card p-6 text-center text-sm text-text-muted md:border-0 md:bg-none md:p-0 md:shadow-none">
      {anyTrades ? (
        'No trades match the current filters.'
      ) : (
        <>
          No trades logged yet.{' '}
          <Link to="/log" className="font-semibold text-accent-purple hover:underline">
            Hit + Log Trade
          </Link>{' '}
          to get started.
        </>
      )}
    </div>
  )
}

function MobileTradeCard({
  trade: t,
  accountName,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  trade: Trade
  accountName: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="card min-h-[44px] p-3" onClick={onToggle}>
      <div className="flex items-center gap-2">
        <span className={`badge shrink-0 ${SYMBOL_COLORS[t.symbol]}`}>{t.symbol}</span>
        <span
          className={`badge shrink-0 ${
            t.side === 'LONG'
              ? 'bg-accent-green/15 text-accent-green'
              : 'bg-accent-red/15 text-accent-red'
          }`}
        >
          {t.side}
        </span>
        <span className="min-w-0 truncate text-sm">{t.setup || '—'}</span>
        <span className="num ml-auto shrink-0 text-xs text-text-muted">
          {t.date.slice(5)} {t.time}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={`num text-sm font-semibold ${moneyClass(t.rMultiple)}`}>
          {fmtR(t.rMultiple)}
        </span>
        <span className={`num text-2xl font-bold ${moneyClass(t.pnl)}`}>{fmtMoney(t.pnl)}</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border pt-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <MobileInfo label="Entry" value={String(t.entryPrice)} />
            <MobileInfo label="Exit" value={String(t.exitPrice)} />
            <MobileInfo label="Stop" value={t.stopPrice ? String(t.stopPrice) : '—'} />
            <MobileInfo label="Size" value={String(t.size)} />
            <MobileInfo label="Duration" value={t.duration || '—'} />
            <MobileInfo label="Account" value={accountName} />
          </div>
          {t.tags.length > 0 && (
            <div className="text-xs text-text-muted">Tags: {t.tags.join(', ')}</div>
          )}
          {t.notes && <p className="break-words text-xs text-text-muted">{t.notes}</p>}
          {t.screenshotUrl && (
            <img
              src={t.screenshotUrl}
              alt="Trade screenshot"
              className="max-h-48 w-full rounded-lg border border-border object-contain"
            />
          )}
          <div className="flex gap-2">
            <button
              className="btn-ghost flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              Edit
            </button>
            <button
              className="btn-danger flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="num truncate text-sm">{value}</div>
    </div>
  )
}

function TradeRow({
  trade: t,
  accountName,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  trade: Trade
  accountName: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/50 transition-colors hover:bg-bg-hover"
        onClick={onToggle}
      >
        <td className="td num">{t.date}</td>
        <td className="td num text-text-muted">{t.time}</td>
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
        <td className="td num">{t.size}</td>
        <td className="td num">{t.entryPrice}</td>
        <td className="td num">{t.exitPrice}</td>
        <td className="td num text-text-muted">{t.stopPrice || '—'}</td>
        <td className={`td num ${moneyClass(t.rMultiple)}`}>{fmtR(t.rMultiple)}</td>
        <td className={`td num font-semibold ${moneyClass(t.pnl)}`}>{fmtMoney(t.pnl)}</td>
        <td className="td text-text-muted">{accountName}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/50 bg-bg-primary/60">
          <td colSpan={12} className="px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Info label="Duration" value={t.duration || '—'} />
                  <Info label="Tags" value={t.tags.length ? t.tags.join(', ') : '—'} />
                  <Info label="Account" value={accountName} />
                  <Info label="Points" value={String(Math.abs(t.exitPrice - t.entryPrice))} />
                </div>
                <div>
                  <div className="field-label">Notes</div>
                  <p className="text-text-muted">{t.notes || 'No notes.'}</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="btn-ghost !py-1.5" onClick={(e) => { e.stopPropagation(); onEdit() }}>
                    Edit
                  </button>
                  <button className="btn-danger !py-1.5" onClick={(e) => { e.stopPropagation(); onDelete() }}>
                    Delete
                  </button>
                </div>
              </div>
              {t.screenshotUrl && (
                <img
                  src={t.screenshotUrl}
                  alt="Trade screenshot"
                  className="max-h-56 rounded-lg border border-border object-contain"
                />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="num text-sm">{value}</div>
    </div>
  )
}
