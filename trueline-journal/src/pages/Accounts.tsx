import { useState } from 'react'
import { useStore } from '../store/useStore'
import { toast } from '../store/useToastStore'
import type { Account, AccountStage, Platform } from '../store/types'
import { PLATFORMS } from '../lib/markets'
import { accountStatus, barColor } from '../lib/guardrails'
import { fmtMoney, moneyClass } from '../lib/format'

interface FormState {
  name: string
  platform: Platform
  stage: AccountStage
  accountSize: string
  startingBalance: string
  currentBalance: string
  dailyLossLimit: string
  trailingDDLimit: string
}

const emptyForm: FormState = {
  name: '',
  platform: 'Topstep',
  stage: 'eval',
  accountSize: '',
  startingBalance: '',
  currentBalance: '',
  dailyLossLimit: '',
  trailingDDLimit: '',
}

const stageBadge = (stage: AccountStage) =>
  stage === 'funded'
    ? 'bg-accent-green/15 text-accent-green'
    : 'bg-accent-yellow/15 text-accent-yellow'

export default function Accounts() {
  const { accounts, trades, addAccount, editAccount, deleteAccount, graduateAccount } =
    useStore()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  // Once the user types in Current Balance it stops mirroring Starting Balance.
  const [balanceTouched, setBalanceTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const funded = accounts.filter((a) => (a.stage ?? 'eval') === 'funded')
  const evals = accounts.filter((a) => (a.stage ?? 'eval') === 'eval')
  const sumBalance = (list: Account[]) => list.reduce((s, a) => s + a.currentBalance, 0)
  const totalPnl = accounts.reduce((s, a) => s + (a.currentBalance - a.startingBalance), 0)

  function setStartingBalance(value: string) {
    set(
      !editingId && !balanceTouched
        ? { startingBalance: value, currentBalance: value }
        : { startingBalance: value },
    )
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Required'
    for (const key of [
      'accountSize',
      'startingBalance',
      'currentBalance',
      'dailyLossLimit',
      'trailingDDLimit',
    ] as const) {
      const v = parseFloat(form[key])
      if (Number.isNaN(v) || v < 0) errs[key] = 'Enter a valid amount'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const base = {
      name: form.name.trim(),
      platform: form.platform,
      stage: form.stage,
      accountSize: parseFloat(form.accountSize),
      startingBalance: parseFloat(form.startingBalance),
      currentBalance: parseFloat(form.currentBalance),
      dailyLossLimit: parseFloat(form.dailyLossLimit),
      trailingDDLimit: parseFloat(form.trailingDDLimit),
    }
    if (editingId) {
      editAccount(editingId, base)
    } else {
      addAccount({ id: crypto.randomUUID(), ...base })
    }
    setForm(emptyForm)
    setEditingId(null)
    setBalanceTouched(false)
    toast(editingId ? 'Account updated ✓' : 'Account added ✓')
  }

  function startEdit(a: Account) {
    setEditingId(a.id)
    setBalanceTouched(true)
    setForm({
      name: a.name,
      platform: a.platform,
      stage: a.stage ?? 'eval',
      accountSize: String(a.accountSize),
      startingBalance: String(a.startingBalance),
      currentBalance: String(a.currentBalance),
      dailyLossLimit: String(a.dailyLossLimit),
      trailingDDLimit: String(a.trailingDDLimit),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this account? Its trades stay but lose the link.')) {
      deleteAccount(id)
      toast('Account deleted', 'info')
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
        setBalanceTouched(false)
      }
    }
  }

  function handleGraduate(a: Account) {
    const ok = window.confirm(
      `Graduate "${a.name}" to funded?\n\nIt will be marked FUNDED and its balance tracking ` +
        `restarts at the starting balance ($${a.startingBalance.toLocaleString()}). ` +
        `Logged trades stay linked for your history.`,
    )
    if (!ok) return
    graduateAccount(a.id)
    toast(`${a.name} graduated to funded 🎉`)
  }

  function renderCard(a: Account) {
    const st = accountStatus(a, trades)
    const stage = a.stage ?? 'eval'
    return (
      <div key={a.id} className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="min-w-0 truncate font-bold">{a.name}</span>
          <span className={`badge shrink-0 ${stageBadge(stage)}`}>
            {stage === 'funded' ? 'FUNDED' : 'EVAL'}
          </span>
          <span className="badge ml-auto shrink-0 bg-accent-blue/15 text-accent-blue">
            {a.platform}
          </span>
        </div>

        <div className="mb-4 flex items-baseline gap-2">
          <span className="num text-2xl font-bold">${st.balance.toLocaleString()}</span>
          <span className={`num text-sm font-semibold ${moneyClass(st.pnlDelta)}`}>
            {fmtMoney(st.pnlDelta)}
          </span>
          <span className="ml-auto text-xs text-text-muted">
            start ${a.startingBalance.toLocaleString()}
          </span>
        </div>

        <Bar label="Daily loss" pct={st.dailyPct} room={st.dailyRoom} limit={a.dailyLossLimit} />
        <Bar label="Trailing DD" pct={st.ddPct} room={st.ddRoom} limit={a.trailingDDLimit} />

        {stage === 'eval' && (
          <button className="btn-green mt-4 w-full" onClick={() => handleGraduate(a)}>
            ⬆ Graduate to funded
          </button>
        )}
        <div className="mt-2 flex gap-2">
          <button className="btn-ghost flex-1 !py-1.5" onClick={() => startEdit(a)}>
            Edit
          </button>
          <button className="btn-danger flex-1 !py-1.5" onClick={() => handleDelete(a.id)}>
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Accounts</h1>

      {/* Account balances summary */}
      {accounts.length > 0 && (
        <div className="card card-green p-5">
          <h2 className="card-title mb-3">Account balances</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryStat
              label={`Funded (${funded.length})`}
              value={`$${sumBalance(funded).toLocaleString()}`}
              className="text-accent-green"
            />
            <SummaryStat
              label={`Evals (${evals.length})`}
              value={`$${sumBalance(evals).toLocaleString()}`}
              className="text-accent-yellow"
            />
            <SummaryStat
              label="Combined balance"
              value={`$${sumBalance(accounts).toLocaleString()}`}
            />
            <SummaryStat
              label="Combined P&L"
              value={fmtMoney(totalPnl)}
              className={moneyClass(totalPnl)}
            />
          </div>
        </div>
      )}

      {/* Add / edit form */}
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          {editingId ? 'Edit account' : 'Add account'}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Name" error={errors.name}>
            <input
              className="field"
              placeholder="e.g. Topstep 50K #1"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </Field>
          <Field label="Platform">
            <select
              className="field"
              value={form.platform}
              onChange={(e) => set({ platform: e.target.value as Platform })}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Account type">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['eval', 'Eval'],
                  ['funded', 'Funded'],
                ] as [AccountStage, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set({ stage: value })}
                  className={`min-h-[44px] rounded-lg border py-2 text-sm font-bold transition-colors md:min-h-0 ${
                    form.stage === value
                      ? value === 'funded'
                        ? 'border-accent-green bg-accent-green/15 text-accent-green'
                        : 'border-accent-yellow bg-accent-yellow/15 text-accent-yellow'
                      : 'border-border bg-bg-primary text-text-muted hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Account size ($)" error={errors.accountSize}>
            <input type="number" className="field num" value={form.accountSize}
              onChange={(e) => set({ accountSize: e.target.value })} />
          </Field>
          <Field label="Starting balance ($)" error={errors.startingBalance}>
            <input type="number" className="field num" value={form.startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)} />
          </Field>
          <Field label="Current balance ($)" error={errors.currentBalance}>
            <input type="number" className="field num" value={form.currentBalance}
              onChange={(e) => {
                setBalanceTouched(true)
                set({ currentBalance: e.target.value })
              }} />
          </Field>
          <Field label="Daily loss limit ($)" error={errors.dailyLossLimit}>
            <input type="number" className="field num" value={form.dailyLossLimit}
              onChange={(e) => set({ dailyLossLimit: e.target.value })} />
          </Field>
          <Field label="Trailing DD limit ($)" error={errors.trailingDDLimit}>
            <input type="number" className="field num" value={form.trailingDDLimit}
              onChange={(e) => set({ trailingDDLimit: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end gap-3">
          {editingId && (
            <button
              className="btn-ghost"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
                setBalanceTouched(false)
              }}
            >
              Cancel
            </button>
          )}
          <button className="btn-primary max-md:flex-1" onClick={handleSave}>
            {editingId ? 'Save changes' : 'Add account'}
          </button>
        </div>
      </div>

      {/* Cards, grouped by stage */}
      {accounts.length === 0 ? (
        <div className="card p-8 text-center text-sm text-text-muted">
          No accounts added. Add your first funded account to track your prop guardrails.
        </div>
      ) : (
        <>
          {funded.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
                <span className="h-2 w-2 rounded-full bg-accent-green" /> Funded
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {funded.map(renderCard)}
              </div>
            </section>
          )}
          {evals.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
                <span className="h-2 w-2 rounded-full bg-accent-yellow" /> Evaluations
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {evals.map(renderCard)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function SummaryStat({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className={`num mt-1 truncate text-xl font-bold md:text-2xl ${className}`}>
        {value}
      </div>
    </div>
  )
}

function Bar({
  label,
  pct,
  room,
  limit,
}: {
  label: string
  pct: number
  room: number
  limit: number
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between gap-2 text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="num truncate text-text-muted">
          ${room.toLocaleString()} room of ${limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-primary">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  )
}
