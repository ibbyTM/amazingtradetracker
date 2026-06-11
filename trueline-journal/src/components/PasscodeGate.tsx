import { useState } from 'react'
import { useSyncStore } from '../store/useSyncStore'

/** Full-screen lock shown when the sync server wants a passcode. */
export default function PasscodeGate() {
  const status = useSyncStore((s) => s.status)
  const unlock = useSyncStore((s) => s.unlock)
  const [passcode, setPasscode] = useState('')
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  if (status !== 'locked') return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!passcode || busy) return
    setBusy(true)
    const ok = await unlock(passcode)
    setBusy(false)
    if (!ok) {
      setFailed(true)
      setPasscode('')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-primary/90 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="card card-purple w-full max-w-sm p-6 text-center">
        <div
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-base font-extrabold text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}
        >
          T
        </div>
        <h2 className="text-lg font-bold">Trueline is locked</h2>
        <p className="mt-1 text-sm text-text-muted">
          Enter your sync passcode to load your journal on this device.
        </p>
        <input
          type="password"
          autoFocus
          className="field mt-4 text-center"
          placeholder="Passcode"
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value)
            setFailed(false)
          }}
        />
        {failed && <p className="mt-2 text-xs text-accent-red">Wrong passcode — try again.</p>}
        <button type="submit" className="btn-primary mt-4 w-full" disabled={!passcode || busy}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
