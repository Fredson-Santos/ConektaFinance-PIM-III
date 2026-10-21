import { NavLink } from 'react-router-dom'
import { useUi } from '../../context/UiContext'

export function BottomNav() {
  const { openTransactionSheet } = useUi()
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <NavLink to="/dashboard" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`} id="bnav-inicio">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
        </svg>
        <span>Início</span>
      </NavLink>
      <NavLink to="/transacoes" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`} id="bnav-gastos">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
        <span>Gastos</span>
      </NavLink>
      <button
        type="button"
        className="bnav-fab"
        id="bnav-fab"
        aria-label="Nova transação"
        onClick={() => openTransactionSheet()}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <NavLink to="/categorias" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`} id="bnav-categorias">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 3H4v7l10 10 7-7L11 3z" />
          <circle cx="8" cy="7" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <span>Categorias</span>
      </NavLink>
      <NavLink to="/relatorios" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`} id="bnav-relatorios">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20v-9M12 20V4M20 20v-6" />
        </svg>
        <span>Relatórios</span>
      </NavLink>
    </nav>
  )
}

export default BottomNav
