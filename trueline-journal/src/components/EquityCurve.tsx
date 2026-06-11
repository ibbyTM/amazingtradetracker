import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Trade } from '../store/types'
import { sortTrades } from '../lib/metrics'
import { fmtMoney, moneyClass, todayStr } from '../lib/format'

type Range = 'Day' | 'Week' | 'Month' | 'All'
const RANGES: Range[] = ['Day', 'Week', 'Month', 'All']

function cutoffFor(range: Range): string {
  if (range === 'All') return ''
  const d = new Date()
  if (range === 'Week') d.setDate(d.getDate() - 7)
  if (range === 'Month') d.setMonth(d.getMonth() - 1)
  return range === 'Day' ? todayStr() : todayStr(d)
}

export default function EquityCurve({ trades }: { trades: Trade[] }) {
  const [range, setRange] = useState<Range>('All')

  const data = useMemo(() => {
    const cutoff = cutoffFor(range)
    const filtered = sortTrades(trades).filter((t) => t.date >= cutoff)
    let cum = 0
    return filtered.map((t, i) => {
      cum += t.pnl
      return { i, label: `${t.date} ${t.time}`, cum }
    })
  }, [trades, range])

  return (
    <div className="card animate-fade-up overflow-hidden p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Equity Curve
        </h3>
        <div className="flex gap-1 rounded-lg bg-bg-primary p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                range === r ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="equity-glow relative h-64">
        <div className="equity-aurora" />
        {data.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-text-muted">
            No data yet
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-green)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent-green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              minTickGap={48}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtMoney(v, 0)}
              width={70}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as { label: string; cum: number }
                return (
                  <div className="card border-accent-green/30 px-3.5 py-2.5">
                    <div className="mb-0.5 text-[11px] uppercase tracking-wider text-text-muted">
                      {p.label}
                    </div>
                    <div className={`num text-base font-bold ${moneyClass(p.cum)}`}>
                      {fmtMoney(p.cum)}
                    </div>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="cum"
              stroke="var(--accent-green)"
              strokeWidth={2}
              fill="url(#equityFill)"
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
