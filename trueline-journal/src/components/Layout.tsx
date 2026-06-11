import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import AiAssistant from './AiAssistant'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="ml-14 min-h-screen p-4 md:ml-[220px] md:p-6">
        <Outlet />
      </main>
      <AiAssistant />
    </div>
  )
}
