// Cross-device sync against the bundled Express server (server/index.mjs).
// Strategy: the server document wins when the app loads; afterwards every
// local change is pushed (debounced) and remote changes are pulled on
// focus/visibility plus a 30s poll — but never while local edits are still
// waiting to push, so nothing typed on this device gets clobbered.
// With no server reachable (plain `npm run dev`) the app silently stays
// in local-only mode.
import { create } from 'zustand'
import { useStore, type ExportedData } from './useStore'
import { toast } from './useToastStore'

export type SyncStatus = 'off' | 'locked' | 'syncing' | 'synced' | 'error'

export const SYNC_LABELS: Record<SyncStatus, string> = {
  off: 'Local only',
  locked: 'Locked',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync error',
}

export const SYNC_DOTS: Record<SyncStatus, string> = {
  off: 'bg-text-muted',
  locked: 'bg-accent-red',
  syncing: 'bg-accent-yellow',
  synced: 'bg-accent-green',
  error: 'bg-accent-red',
}

const PASS_KEY = 'trueline-passcode'
export const getPasscode = () => localStorage.getItem(PASS_KEY) ?? ''
export const clearPasscode = () => localStorage.removeItem(PASS_KEY)

const PUSH_DEBOUNCE_MS = 800
const PUSH_RETRY_MS = 5000
const POLL_MS = 30000

interface SyncState {
  status: SyncStatus
  error: string
  init: () => Promise<void>
  unlock: (passcode: string) => Promise<boolean>
  refresh: () => Promise<void>
}

let lastSynced = ''
let dirty = false // local changes not yet on the server
let applyingRemote = false
let subscribed = false
let pushTimer: number | undefined
let retryTimer: number | undefined
let pollTimer: number | undefined

function snapshot(): ExportedData {
  const { trades, accounts, journal, settings } = useStore.getState()
  return { trades, accounts, journal, settings }
}

function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-trueline-pass': getPasscode(),
      ...(init?.headers ?? {}),
    },
  })
}

function applyRemote(remote: ExportedData) {
  applyingRemote = true
  try {
    useStore.getState().importData(remote)
  } finally {
    applyingRemote = false
  }
  // Re-serialize through our own snapshot so future comparisons are
  // byte-stable regardless of which device produced the server copy.
  lastSynced = JSON.stringify(snapshot())
  dirty = false
}

export const useSyncStore = create<SyncState>()((set, get) => ({
  status: 'off',
  error: '',

  init: async () => {
    let res: Response
    try {
      res = await api('/api/data')
    } catch {
      set({ status: 'off' }) // no server reachable
      return
    }
    if (res.status === 401) {
      set({ status: 'locked' })
      return
    }
    if (res.status === 404) {
      set({ status: 'off' }) // vite dev server — no API
      return
    }
    if (!res.ok) {
      set({ status: 'error', error: `Server error ${res.status}` })
      return
    }

    set({ status: 'syncing' })
    const remote = (await res.json()) as ExportedData | null
    if (remote && Array.isArray(remote.trades)) {
      // Server document wins on load — it's the shared copy across devices.
      applyRemote(remote)
    } else {
      // Empty server: seed it with whatever this device already has.
      await pushNow()
    }
    set({ status: 'synced' })

    if (!subscribed) {
      subscribed = true
      useStore.subscribe(onLocalChange)
      startAutoRefresh()
    }
  },

  unlock: async (passcode: string) => {
    localStorage.setItem(PASS_KEY, passcode)
    const res = await api('/api/data').catch(() => null)
    if (!res || res.status === 401) return false
    await get().init()
    return true
  },

  // Pull the latest server copy — used by the focus/poll hooks. Skipped while
  // local edits are pending so a pull can never eat an unsaved change.
  refresh: async () => {
    const status = get().status
    if (status === 'off' || status === 'locked' || dirty) return
    let res: Response
    try {
      res = await api('/api/data')
    } catch {
      return // transient network blip — next poll will retry
    }
    if (res.status === 401) {
      set({ status: 'locked' })
      return
    }
    if (!res.ok) return
    const text = await res.text()
    if (!text || text === 'null' || text === lastSynced) return
    try {
      const remote = JSON.parse(text) as ExportedData
      if (remote && Array.isArray(remote.trades) && !dirty) {
        applyRemote(remote)
        set({ status: 'synced' })
      }
    } catch {
      // malformed payload — ignore
    }
  },
}))

function onLocalChange() {
  if (applyingRemote) return
  if (JSON.stringify(snapshot()) === lastSynced) return
  dirty = true
  useSyncStore.setState({ status: 'syncing' })
  window.clearTimeout(pushTimer)
  pushTimer = window.setTimeout(() => void pushNow(), PUSH_DEBOUNCE_MS)
}

async function pushNow() {
  window.clearTimeout(retryTimer)
  const data = JSON.stringify(snapshot())
  try {
    const res = await api('/api/data', { method: 'PUT', body: data })
    if (res.status === 401) {
      useSyncStore.setState({ status: 'locked' })
      return
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    lastSynced = data
    dirty = false
    useSyncStore.setState({ status: 'synced' })
  } catch (err) {
    useSyncStore.setState({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    })
    toast('Sync failed — retrying…', 'error')
    retryTimer = window.setTimeout(() => void pushNow(), PUSH_RETRY_MS)
  }
}

function startAutoRefresh() {
  const refresh = () => void useSyncStore.getState().refresh()
  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh()
  })
  window.clearInterval(pollTimer)
  pollTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') refresh()
  }, POLL_MS)
}
