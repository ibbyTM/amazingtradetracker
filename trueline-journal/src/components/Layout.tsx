import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTabBar from './MobileTabBar'
import AiAssistant from './AiAssistant'
import PasscodeGate from './PasscodeGate'
import Toasts from './Toasts'

export default function Layout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-primary">
      <Sidebar />
      {/* bottom padding clears the mobile tab bar */}
      <main className="min-h-screen p-3 pb-[84px] md:ml-[220px] md:p-6 md:pb-6">
        <Outlet />
      </main>
      <MobileTabBar />
      <AiAssistant />
      <PasscodeGate />
      <Toasts />
    </div>
  )
}
