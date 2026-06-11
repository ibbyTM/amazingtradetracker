import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import type { Bias, DailyEntry } from '../store/types'
import { fmtMoney, fmtR, moneyClass, todayStr } from '../lib/format'
import { SYMBOL_COLORS } from '../lib/markets'

const BIASES: Bias[] = ['Bullish', 'Bearish', 'Neutral']
const MENTAL_EMOJI: Record<number, string> = {
  1: '😫 Exhausted',
  2: '😕 Off',
  3: '😐 Neutral',
  4: '🙂 Good',
  5: '🎯 Focused / sharp',
}

const emptyEntry = (date: string): DailyEntry => ({
  date,
  bias: 'Neutral',
  keyLevels: '',
  mentalState: 3,
  gamePlan: '',
  whatWentWell: '',
  mistakes: '',
  lesson: '',
})

export default function Journal() {
  const { trades, journal, addJournalEntry } = useStore()
  const [date, setDate] = useState(todayStr())
  const [entry, setEntry] = useState<DailyEntry>(() => emptyEntry(todayStr()))
  const [saved, setSaved] = useState(false)

  // Load the saved entry whenever the selected date changes.
  useEffect(() => {
    setEntry(journal.find((e) => e.date === date) ?? emptyEntry(date))
    setSaved(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const set = (patch: Partial<DailyEntry>) => {
    setEntry((e) => ({ ...e, ...patch }))
    setSaved(false)
  }

  function handleSave() {
    addJournalEntry({ ...entry, date })
    setSaved(true)
  }

  const dayTrades = trades.filter((t) => t.date === date)
  const dayPnl = dayTrades.reduce((s, t) => s + t.pnl, 0)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Daily Journal</h1>
        <input
          type="date"
          className="field w-full md:max-w-[180px]"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </header>

      {/* Pre-session */}
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Pre-Session
        </h2>

        <div>
          <label className="field-label">Bias</label>
          <div className="grid grid-cols-3 gap-2 md:flex">
            {BIASES.map((b) => (
              <button
                key={b}
                onClick={() => set({ bias: b })}
                className={`min-h-[44px] rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors md:min-h-0 ${
                  entry.bias === b
                    ? b === 'Bullish'
                      ? 'border-accent-green bg-accent-green/15 text-accent-green'
                      : b === 'Bearish'
                        ? 'border-accent-red bg-accent-red/15 text-accent-red'
                        : 'border-accent-blue bg-accent-blue/15 text-accent-blue'
                    : 'border-border text-text-muted hover:text-text-primary'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Key levels</label>
          <textarea
            className="field min-h-[100px]"
            placeholder="Overnight high/low, VWAP, prior day levels…"
            value={entry.keyLevels}
            onChange={(e) => set({ keyLevels: e.target.value })}
          />
        </div>

        <div>
          <label className="field-label">
            Mental state — {MENTAL_EMOJI[entry.mentalState]}
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={entry.mentalState}
            onChange={(e) => set({ mentalState: Number(e.target.value) })}
            className="w-full accent-[--accent-purple]"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>😫 exhausted</span>
            <span>😐 neutral</span>
            <span>🎯 focused</span>
          </div>
        </div>

        <div>
          <label className="field-label">Game plan</label>
          <textarea
            className="field min-h-[100px]"
            placeholder="What are you looking for today? What will keep you out of trouble?"
            value={entry.gamePlan}
            onChange={(e) => set({ gamePlan: e.target.value })}
          />
        </div>
      </div>

      {/* Post-session */}
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Post-Session
        </h2>
        <div>
          <label className="field-label">What went well</label>
          <textarea
            className="field min-h-[100px]"
            value={entry.whatWentWell}
            onChange={(e) => set({ whatWentWell: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Mistakes</label>
          <textarea
            className="field min-h-[100px]"
            value={entry.mistakes}
            onChange={(e) => set({ mistakes: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Lesson learned</label>
          <textarea
            className="field min-h-[100px]"
            value={entry.lesson}
            onChange={(e) => set({ lesson: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-accent-green">Saved ✓</span>}
          <button className="btn-primary" onClick={handleSave}>
            Save entry
          </button>
        </div>
      </div>

      {/* Trades that day */}
      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
            Trades on {date}
          </h2>
          {dayTrades.length > 0 && (
            <span className={`num text-sm font-semibold ${moneyClass(dayPnl)}`}>
              {fmtMoney(dayPnl)}
            </span>
          )}
        </div>
        {dayTrades.length === 0 ? (
          <p className="text-sm text-text-muted">No trades on this date.</p>
        ) : (
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
                  <td className="td">{t.side}</td>
                  <td className="td">{t.setup || '—'}</td>
                  <td className={`td num text-right ${moneyClass(t.rMultiple)}`}>
                    {fmtR(t.rMultiple)}
                  </td>
                  <td className={`td num text-right font-semibold ${moneyClass(t.pnl)}`}>
                    {fmtMoney(t.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
