import { useRef, useState } from 'react'
import { useStore, type ExportedData } from '../store/useStore'
import { SYNC_LABELS, clearPasscode, useSyncStore } from '../store/useSyncStore'
import type { RCalcMethod, SymbolCode } from '../store/types'
import { SYMBOLS } from '../lib/markets'
import Modal from '../components/Modal'

export default function Settings() {
  const { trades, accounts, journal, settings, updateSettings, importData, clearAll } =
    useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [importError, setImportError] = useState('')

  function setTickValue(symbol: SymbolCode, raw: string) {
    const v = parseFloat(raw)
    if (Number.isNaN(v) || v < 0) return
    updateSettings({ tickValues: { ...settings.tickValues, [symbol]: v } })
  }

  function exportJson() {
    const data: ExportedData = { trades, accounts, journal, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trueline-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file: File | undefined) {
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as ExportedData
        if (!Array.isArray(data.trades) || !Array.isArray(data.accounts)) {
          throw new Error('Not a Trueline export file')
        }
        importData(data)
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Profile</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Display name</label>
            <input
              className="field"
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Default symbol</label>
            <select
              className="field"
              value={settings.defaultSymbol}
              onChange={(e) => updateSettings({ defaultSymbol: e.target.value as SymbolCode })}
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Tick values ($ per point per contract)
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SYMBOLS.map((s) => (
            <div key={s}>
              <label className="field-label">{s}</label>
              <input
                type="number"
                step="any"
                className="field num"
                value={settings.tickValues[s]}
                onChange={(e) => setTickValue(s, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          R multiple calculation
        </h2>
        {(
          [
            ['fixed', 'Fixed Stop — risk is entry-to-stop distance (recommended)'],
            ['atr', 'ATR-based — risk derived from average true range'],
          ] as [RCalcMethod, string][]
        ).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="radio"
              name="rmethod"
              checked={settings.rCalcMethod === value}
              onChange={() => updateSettings({ rCalcMethod: value })}
              className="accent-[--accent-purple]"
            />
            {label}
          </label>
        ))}
      </div>

      <SyncCard />

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
          Data management
        </h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn-ghost" onClick={exportJson}>
            ⬇ Export all data (JSON)
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            ⬆ Import from JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
          <button className="btn-danger" onClick={() => setConfirmClear(true)}>
            Clear all data
          </button>
        </div>
        {importError && <p className="text-sm text-accent-red">{importError}</p>}
        <p className="text-xs text-text-muted">
          {trades.length} trades · {accounts.length} accounts · {journal.length} journal entries
          stored locally in your browser.
        </p>
      </div>

      {confirmClear && (
        <Modal title="Clear all data?" onClose={() => setConfirmClear(false)}>
          <p className="mb-4 text-sm text-text-muted">
            This permanently deletes every trade, account, journal entry and setting from this
            browser. Export a JSON backup first if you might want it back.
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn-ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                clearAll()
                setConfirmClear(false)
              }}
            >
              Yes, delete everything
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SyncCard() {
  const status = useSyncStore((s) => s.status)
  const error = useSyncStore((s) => s.error)

  return (
    <div className="card space-y-3 p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
        Device sync
      </h2>
      <p className="text-sm">
        Status: <span className="font-semibold">{SYNC_LABELS[status]}</span>
        {status === 'error' && <span className="ml-2 text-accent-red">{error}</span>}
      </p>
      {status === 'off' ? (
        <p className="text-xs text-text-muted">
          No sync server detected — data stays in this browser only. The deployed (Railway)
          version syncs automatically across your devices.
        </p>
      ) : (
        <>
          <p className="text-xs text-text-muted">
            Your journal is stored on the server and shared by every device that unlocks it
            with the passcode. The last edit wins when two devices change data at once.
          </p>
          <button
            className="btn-ghost"
            onClick={() => {
              clearPasscode()
              void useSyncStore.getState().init()
            }}
          >
            Re-enter passcode…
          </button>
        </>
      )}
    </div>
  )
}
