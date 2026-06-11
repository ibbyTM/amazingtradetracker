import { NavLink } from 'react-router-dom'
import { SYNC_LABELS, useSyncStore } from '../store/useSyncStore'

const SYNC_DOTS: Record<string, string> = {
  off: 'bg-text-muted',
  locked: 'bg-accent-red',
  syncing: 'bg-accent-yellow',
  synced: 'bg-accent-green',
  error: 'bg-accent-red',
}

const SECTIONS: { title: string; items: { to: string; icon: string; label: string }[] }[] = [
  {
    title: 'MAIN',
    items: [
      { to: '/dashboard', icon: '◧', label: 'Dashboard' },
      { to: '/log', icon: '＋', label: 'Log Trade' },
      { to: '/journal', icon: '✎', label: 'Daily Journal' },
      { to: '/trades', icon: '≣', label: 'Trades' },
    ],
  },
  {
    title: 'ANALYSE',
    items: [
      { to: '/reports', icon: '◔', label: 'Reports' },
      { to: '/accounts', icon: '⌂', label: 'Accounts' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [{ to: '/settings', icon: '⚙', label: 'Settings' }],
  },
]

/** Desktop-only navigation — mobile uses the bottom tab bar instead. */
export default function Sidebar() {
  const syncStatus = useSyncStore((s) => s.status)

  return (
    <aside
      className="sidebar-gradient fixed left-0 top-0 z-50 hidden h-full w-[220px] flex-col
        border-r border-border md:flex"
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm
            font-extrabold text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}
        >
          T
        </div>
        <div>
          <div className="text-base font-extrabold tracking-widest text-text-primary">
            TRUELINE
          </div>
          <div className="text-[10px] font-semibold tracking-[0.25em] text-accent-purple">
            TRADE INTELLIGENCE
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.2em] text-text-muted">
              {section.title}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-3 rounded-r-lg border-l-2 px-3 py-2 text-sm
                   font-medium transition-colors ${
                     isActive
                       ? 'nav-active border-accent-purple bg-bg-hover text-text-primary'
                       : 'border-transparent text-text-muted hover:bg-bg-hover hover:text-text-primary'
                   }`
                }
              >
                <span className="w-4 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-text-muted">
        <span className={`h-2 w-2 rounded-full ${SYNC_DOTS[syncStatus]}`} />
        <span>Trueline AI · {SYNC_LABELS[syncStatus]}</span>
      </div>
    </aside>
  )
}
