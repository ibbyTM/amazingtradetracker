import { useMemo, useState } from 'react'
import type { Trade } from '../store/types'
import { fmtMoney, moneyClass, todayStr } from '../lib/format'
import Modal from './Modal'
import { SYMBOL_COLORS } from '../lib/markets'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayCell {
  date: string
  day: number
  pnl: number
  count: number
}

export default function PnlCalendar({ trades }: { trades: Trade[] }) {
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const byDate = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number }>()
    for (const t of trades) {
      const cur = map.get(t.date) ?? { pnl: 0, count: 0 }
      map.set(t.date, { pnl: cur.pnl + t.pnl, count: cur.count + 1 })
    }
    return map
  }, [trades])

  const cells = useMemo<(DayCell | null)[]>(() => {
    const year = monthStart.getFullYear()
    const month = monthStart.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstWeekday = (monthStart.getDay() + 6) % 7 // Monday = 0
    const out: (DayCell | null)[] = Array.from({ length: firstWeekday }, () => null)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const agg = byDate.get(date)
      out.push({ date, day, pnl: agg?.pnl ?? 0, count: agg?.count ?? 0 })
    }
    return out
  }, [monthStart, byDate])

  const monthLabel = monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const shiftMonth = (delta: number) =>
    setMonthStart((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))

  const dayTrades = selectedDay ? trades.filter((t) => t.date === selectedDay) : []

  return (
    <div className="card animate-fade-up p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Monthly P&amp;L
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <button className="btn-ghost !px-2 !py-1" onClick={() => shiftMonth(-1)}>
            ‹
          </button>
          <span className="w-36 text-center font-semibold">{monthLabel}</span>
          <button className="btn-ghost !px-2 !py-1" onClick={() => shiftMonth(1)}>
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-bold text-text-muted">
            {d}
          </div>
        ))}
        {cells.map((cell, idx) =>
          cell === null ? (
            <div key={`pad-${idx}`} />
          ) : (
            <button
              key={cell.date}
              onClick={() => cell.count > 0 && setSelectedDay(cell.date)}
              className={`flex min-h-[58px] flex-col items-start rounded-lg border p-1.5 text-left
                transition-all duration-150 hover:-translate-y-0.5 ${
                  cell.count === 0
                    ? 'cursor-default border-border bg-bg-primary text-text-muted hover:translate-y-0'
                    : cell.pnl > 0
                      ? 'border-accent-green/30 bg-accent-green/10 shadow-[0_0_14px_rgba(0,212,170,0.22)] hover:bg-accent-green/20'
                      : cell.pnl < 0
                        ? 'border-accent-red/30 bg-accent-red/10 shadow-[0_0_14px_rgba(255,71,87,0.22)] hover:bg-accent-red/20'
                        : 'border-border bg-bg-hover hover:bg-border'
                } ${cell.date === todayStr() ? 'ring-1 ring-accent-purple' : ''}`}
            >
              <span className="text-[10px] text-text-muted">{cell.day}</span>
              {cell.count > 0 && (
                <>
                  <span className={`num text-xs font-semibold ${moneyClass(cell.pnl)}`}>
                    {fmtMoney(cell.pnl, 0)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {cell.count} trade{cell.count > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </button>
          ),
        )}
      </div>

      {selectedDay && (
        <Modal title={`Trades — ${selectedDay}`} onClose={() => setSelectedDay(null)}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="th">Time</th>
                <th className="th">Symbol</th>
                <th className="th">Side</th>
                <th className="th">Setup</th>
                <th className="th text-right">R</th>
                <th className="th text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {dayTrades.map((t) => (
                <tr key={t.id} className="border-b border-border/50">
                  <td className="td num">{t.time}</td>
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
                  <td className="td num text-right">{t.rMultiple.toFixed(2)}</td>
                  <td className={`td num text-right font-semibold ${moneyClass(t.pnl)}`}>
                    {fmtMoney(t.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  )
}
