import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { hello } from '@fable/Main.js'
import { useSyncStore } from './store/useSyncStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LogTrade from './pages/LogTrade'
import Trades from './pages/Trades'
import Journal from './pages/Journal'
import Accounts from './pages/Accounts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import './index.css'

// Smoke test: proves the F# → Fable → JS pipeline is wired up.
console.info(hello())

// Connect to the sync server if one is hosting us (no-op in plain vite dev).
void useSyncStore.getState().init()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<LogTrade />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
