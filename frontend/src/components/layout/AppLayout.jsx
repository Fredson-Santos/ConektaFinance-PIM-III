import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { NotificationsPopover } from './NotificationsPopover'
import { AiFab } from '../ai/AiFab'
import { AiPanel } from '../ai/AiPanel'
import { ImportSheet } from '../import/ImportSheet'
import { CommandPalette } from '../cmdk/CommandPalette'
import { PwaInstallBanner } from './PwaInstallBanner'
import { TransactionSheet } from '../transactions/TransactionSheet'

export function AppLayout() {
  return (
    <>
      <div className="app-glow" />
      <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <PwaInstallBanner />
        <Topbar />
        <div className="view-container">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <NotificationsPopover />
      <CommandPalette />
      <AiFab />
      <AiPanel />
      <ImportSheet />
      <TransactionSheet />
    </div>
    </>
  )
}

export default AppLayout
