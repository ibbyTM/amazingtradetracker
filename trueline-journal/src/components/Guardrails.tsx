import type { Account, Trade } from '../store/types'
import { accountStatus, barColor } from '../lib/guardrails'
import { fmtMoney } from '../lib/format'

function LimitBar({
  label,
  used,
  limit,
  pct,
  room,
}: {
  label: string
  used: number
  limit: number
  pct: number
  room: number
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-text-muted">{label}</span>
        <span className="num text-text-muted">
          ${used.toLocaleString()} / ${limit.toLocaleString()} · room {fmtMoney(room, 0)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-primary">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Guardrails({
  accounts,
  trades,
}: {
  accounts: Account[]
  trades: Trade[]
}) {
  return (
    <div className="card animate-fade-up p-5">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
        Prop Guardrails
      </h3>
      {accounts.length === 0 ? (
        <p className="text-sm text-text-muted">
          No accounts added. Add your first funded account to track your prop guardrails.
        </p>
      ) : (
        accounts.map((a) => {
          const st = accountStatus(a, trades)
          return (
            <div key={a.id} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{a.name}</span>
                <span className="badge bg-accent-blue/15 text-accent-blue">{a.platform}</span>
              </div>
              <LimitBar
                label="Daily loss"
                used={st.dailyUsed}
                limit={a.dailyLossLimit}
                pct={st.dailyPct}
                room={st.dailyRoom}
              />
              <LimitBar
                label="Trailing DD"
                used={st.ddUsed}
                limit={a.trailingDDLimit}
                pct={st.ddPct}
                room={st.ddRoom}
              />
            </div>
          )
        })
      )}
    </div>
  )
}
