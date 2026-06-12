import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { calcPoints, calcRMultiple, calcTradePnl } from '@fable/Metrics.js'
import { useStore } from '../store/useStore'
import { toast } from '../store/useToastStore'
import type { Side, SymbolCode, Trade } from '../store/types'
import { SYMBOLS, pointValue } from '../lib/markets'
import { durationBetween, fmtMoney, fmtR, moneyClass, nowTime, todayStr } from '../lib/format'

interface FormState {
  date: string
  time: string
  exitTime: string
  accountId: string
  symbol: SymbolCode
  side: Side
  setup: string
  tags: string
  entryPrice: string
  stopPrice: string
  exitPrice: string
  size: string
  notes: string
  screenshotUrl: string
}

export default function LogTrade() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')

  const { trades, accounts, settings, addTrade, editTrade } = useStore()

  const [form, setForm] = useState<FormState>(() => ({
    date: todayStr(),
    time: nowTime(),
    exitTime: '',
    accountId: accounts[0]?.id ?? '',
    symbol: settings.defaultSymbol,
    side: 'LONG',
    setup: '',
    tags: '',
    entryPrice: '',
    stopPrice: '',
    exitPrice: '',
    size: '1',
    notes: '',
    screenshotUrl: '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Blocks double-taps on Save from logging the same trade twice.
  const savedRef = useRef(false)

  // Pre-fill when arriving via "Edit" on the trades page.
  useEffect(() => {
    if (!editId) return
    const t = trades.find((x) => x.id === editId)
    if (!t) return
    setForm({
      date: t.date,
      time: t.time,
      exitTime: '',
      accountId: t.accountId,
      symbol: t.symbol,
      side: t.side,
      setup: t.setup,
      tags: t.tags.join(', '),
      entryPrice: String(t.entryPrice),
      stopPrice: t.stopPrice ? String(t.stopPrice) : '',
      exitPrice: String(t.exitPrice),
      size: String(t.size),
      notes: t.notes,
      screenshotUrl: t.screenshotUrl,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const setupOptions = useMemo(
    () => [...new Set(trades.map((t) => t.setup).filter(Boolean))],
    [trades],
  )

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  // Live auto-calculated fields — math runs in F# (src/fsharp/Metrics.fs).
  const calc = useMemo(() => {
    const entry = parseFloat(form.entryPrice)
    const stop = parseFloat(form.stopPrice)
    const exit = parseFloat(form.exitPrice)
    const size = parseFloat(form.size)
    if ([entry, exit, size].some(Number.isNaN)) return null
    const pv = pointValue(form.symbol, settings)
    return {
      points: calcPoints(form.side, entry, exit),
      pnl: calcTradePnl(form.side, entry, exit, size, pv),
      r: Number.isNaN(stop) ? 0 : calcRMultiple(form.side, entry, stop, exit),
      duration: form.exitTime ? durationBetween(form.time, form.exitTime) : '',
    }
  }, [form, settings])

  function handleScreenshot(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set({ screenshotUrl: String(reader.result ?? '') })
    reader.readAsDataURL(file)
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.date) errs.date = 'Required'
    if (!form.time) errs.time = 'Required'
    if (!form.entryPrice || Number.isNaN(parseFloat(form.entryPrice)))
      errs.entryPrice = 'Enter a valid price'
    if (!form.exitPrice || Number.isNaN(parseFloat(form.exitPrice)))
      errs.exitPrice = 'Enter a valid price'
    if (form.stopPrice && Number.isNaN(parseFloat(form.stopPrice)))
      errs.stopPrice = 'Enter a valid price'
    const size = parseFloat(form.size)
    if (Number.isNaN(size) || size <= 0) errs.size = 'Must be > 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (savedRef.current) return
    if (!validate() || !calc) {
      toast('Check the highlighted fields', 'error')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Catch accidental re-entry of the same trade (no feedback used to make
    // people tap Save repeatedly).
    if (!editId) {
      const duplicate = trades.find(
        (x) =>
          x.date === form.date &&
          x.time === form.time &&
          x.symbol === form.symbol &&
          x.side === form.side &&
          x.entryPrice === parseFloat(form.entryPrice) &&
          x.exitPrice === parseFloat(form.exitPrice) &&
          x.size === parseFloat(form.size),
      )
      if (
        duplicate &&
        !window.confirm('This looks identical to a trade you already logged. Add it anyway?')
      ) {
        return
      }
    }

    const trade: Trade = {
      id: editId ?? crypto.randomUUID(),
      date: form.date,
      time: form.time,
      symbol: form.symbol,
      side: form.side,
      setup: form.setup.trim(),
      size: parseFloat(form.size),
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
      stopPrice: form.stopPrice ? parseFloat(form.stopPrice) : 0,
      duration: calc.duration,
      pnl: calc.pnl,
      rMultiple: calc.r,
      notes: form.notes.trim(),
      screenshotUrl: form.screenshotUrl,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      accountId: form.accountId,
    }
    savedRef.current = true
    if (editId) editTrade(editId, trade)
    else addTrade(trade)
    toast(editId ? 'Trade updated ✓' : `Trade saved ✓  ${fmtMoney(calc.pnl)}`)
    navigate('/trades')
  }

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => set({ [key]: e.target.value } as Partial<FormState>),
  })

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">{editId ? 'Edit Trade' : 'Log Trade'}</h1>

      <div className="card space-y-4 p-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date" error={errors.date}>
            <input type="date" className="field" {...field('date')} />
          </Field>
          <Field label="Time" error={errors.time}>
            <input type="time" className="field" {...field('time')} />
          </Field>
          <Field label="Account">
            <select className="field" {...field('accountId')}>
              <option value="">No account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.platform})
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Symbol">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set({ symbol: s })}
                  className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-bold
                    transition-colors ${
                      form.symbol === s
                        ? 'border-accent-purple bg-accent-purple/15 text-accent-purple'
                        : 'border-border bg-bg-primary text-text-muted hover:text-text-primary'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Side">
            <div className="grid grid-cols-2 gap-2">
              {(['LONG', 'SHORT'] as Side[]).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => set({ side })}
                  className={`rounded-lg border py-2 text-sm font-bold transition-colors ${
                    form.side === side
                      ? side === 'LONG'
                        ? 'border-accent-green bg-accent-green/15 text-accent-green'
                        : 'border-accent-red bg-accent-red/15 text-accent-red'
                      : 'border-border bg-bg-primary text-text-muted hover:text-text-primary'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Setup">
            <input
              className="field"
              list="setup-options"
              placeholder="e.g. ORB breakout"
              {...field('setup')}
            />
            <datalist id="setup-options">
              {setupOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Tags (comma separated)">
            <input className="field" placeholder="A+, news, revenge" {...field('tags')} />
          </Field>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Entry Price" error={errors.entryPrice}>
            <input type="number" step="any" className="field num" {...field('entryPrice')} />
          </Field>
          <Field label="Stop Price" error={errors.stopPrice}>
            <input type="number" step="any" className="field num" {...field('stopPrice')} />
          </Field>
          <Field label="Exit Price" error={errors.exitPrice}>
            <input type="number" step="any" className="field num" {...field('exitPrice')} />
          </Field>
          <Field label="Size (contracts)" error={errors.size}>
            <input type="number" step="1" min="1" className="field num" {...field('size')} />
          </Field>
        </div>

        {/* Exit time for duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Exit time (optional, for duration)">
            <input type="time" className="field" {...field('exitTime')} />
          </Field>
        </div>

        {/* Row 5 — auto-calculated */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-bg-primary p-4 sm:grid-cols-4">
          <ReadOnly label="P&L">
            <span className={`num font-bold ${moneyClass(calc?.pnl ?? 0)}`}>
              {calc ? fmtMoney(calc.pnl) : '—'}
            </span>
          </ReadOnly>
          <ReadOnly label="R Multiple">
            <span className={`num font-bold ${moneyClass(calc?.r ?? 0)}`}>
              {calc ? fmtR(calc.r) : '—'}
            </span>
          </ReadOnly>
          <ReadOnly label="Points">
            <span className="num font-bold">{calc ? calc.points.toFixed(2) : '—'}</span>
          </ReadOnly>
          <ReadOnly label="Duration">
            <span className="num font-bold">{calc?.duration || '—'}</span>
          </ReadOnly>
        </div>

        <Field label="Notes">
          <textarea
            className="field min-h-[96px]"
            placeholder="What did you see? Why did you take it?"
            {...field('notes')}
          />
        </Field>

        <Field label="Screenshot">
          <input
            type="file"
            accept="image/*"
            className="field"
            onChange={(e) => handleScreenshot(e.target.files?.[0])}
          />
          {form.screenshotUrl && (
            <img
              src={form.screenshotUrl}
              alt="Trade screenshot"
              className="mt-2 max-h-48 rounded-lg border border-border"
            />
          )}
        </Field>

        {/* desktop actions */}
        <div className="hidden justify-end gap-3 md:flex">
          <button className="btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn-green" onClick={handleSave}>
            {editId ? 'Save changes' : 'Save trade'}
          </button>
        </div>

        {/* spacer so the fixed mobile save button doesn't cover content */}
        <div className="h-14 md:hidden" />
      </div>

      {/* mobile: full-width save pinned above the tab bar */}
      <div className="fixed inset-x-3 bottom-[68px] z-40 md:hidden">
        <button className="btn-green h-14 w-full text-base shadow-card" onClick={handleSave}>
          {editId ? 'Save changes' : 'Save trade'}
        </button>
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

function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="text-base">{children}</div>
    </div>
  )
}
