import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/dashboard', icon: '◧', label: 'Dashboard' },
  { to: '/log', icon: '＋', label: 'Log Trade' },
  { to: '/trades', icon: '≣', label: 'Trades' },
  { to: '/journal', icon: '✎', label: 'Journal' },
]

const MORE_ITEMS = [
  { to: '/accounts', icon: '⌂', label: 'Accounts' },
  { to: '/reports', icon: '◔', label: 'Reports' },
  { to: '/settings', icon: '⚙', label: 'Settings' },
]

/** Mobile-only bottom navigation: 4 tabs + a "More" slide-up drawer. */
export default function MobileTabBar() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const moreActive = MORE_ITEMS.some((m) => location.pathname.startsWith(m.to))

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* slide-up "More" drawer */}
      <div
        className={`fixed inset-x-0 bottom-[60px] z-40 rounded-t-2xl border-t border-border
          bg-bg-card p-3 transition-transform duration-200 md:hidden ${
            moreOpen ? 'translate-y-0' : 'pointer-events-none translate-y-[120%]'
          }`}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />
        {MORE_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                isActive ? 'bg-bg-hover text-accent-purple' : 'text-text-primary'
              }`
            }
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-[60px] border-t border-border
          bg-bg-primary md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-accent-purple' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-lg leading-none">{tab.icon}</span>
                {isActive && <span className="text-xs font-semibold leading-none">{tab.label}</span>}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${
            moreOpen || moreActive ? 'text-accent-purple' : 'text-text-muted'
          }`}
        >
          <span className="text-lg leading-none">⋯</span>
          {(moreOpen || moreActive) && (
            <span className="text-xs font-semibold leading-none">More</span>
          )}
        </button>
      </nav>
    </>
  )
}
