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
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="app-glow" />
      <div className="app-shell app">
        <Sidebar />
        <main className="main-area main">
          <PwaInstallBanner />
          <Topbar />
          <div className="view-container" id="conteudo" tabIndex={-1}>
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
