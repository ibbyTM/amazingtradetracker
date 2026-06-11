// Cross-device sync against the bundled Express server (server/index.mjs).
// Strategy: the server document wins when the app loads; afterwards every
// local change is pushed (debounced). With no server reachable (e.g. plain
// `npm run dev`), the app silently stays in local-only mode.
import { create } from 'zustand'
import { useStore, type ExportedData } from './useStore'

export type SyncStatus = 'off' | 'locked' | 'syncing' | 'synced' | 'error'

export const SYNC_LABELS: Record<SyncStatus, string> = {
  off: 'Local only',
  locked: 'Locked',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync error',
}

const PASS_KEY = 'trueline-passcode'
export const getPasscode = () => localStorage.getItem(PASS_KEY) ?? ''
export const clearPasscode = () => localStorage.removeItem(PASS_KEY)

interface SyncState {
  status: SyncStatus
  error: string
  init: () => Promise<void>
  unlock: (passcode: string) => Promise<boolean>
}

let lastSynced = ''
let pushTimer: number | undefined
let subscribed = false

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
      lastSynced = JSON.stringify(remote)
      useStore.getState().importData(remote)
    } else {
      // Empty server: seed it with whatever this device already has.
      await pushNow()
    }
    set({ status: 'synced' })

    if (!subscribed) {
      subscribed = true
      useStore.subscribe(schedulePush)
    }
  },

  unlock: async (passcode: string) => {
    localStorage.setItem(PASS_KEY, passcode)
    const res = await api('/api/data').catch(() => null)
    if (!res || res.status === 401) return false
    await get().init()
    return true
  },
}))

function schedulePush() {
  if (JSON.stringify(snapshot()) === lastSynced) return
  useSyncStore.setState({ status: 'syncing' })
  window.clearTimeout(pushTimer)
  pushTimer = window.setTimeout(() => void pushNow(), 1200)
}

async function pushNow() {
  const data = JSON.stringify(snapshot())
  try {
    const res = await api('/api/data', { method: 'PUT', body: data })
    if (res.status === 401) {
      useSyncStore.setState({ status: 'locked' })
      return
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    lastSynced = data
    useSyncStore.setState({ status: 'synced' })
  } catch (err) {
    useSyncStore.setState({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
