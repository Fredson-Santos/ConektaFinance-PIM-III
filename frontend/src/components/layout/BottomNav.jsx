import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, Target, BarChart3, Plus } from 'lucide-react'
import { useUi } from '../../context/UiContext'

export function BottomNav() {
  const { openOverlay } = useUi()
  return (
    <nav className="bottom-nav" aria-label="Navegação inferior">
      <NavLink to="/dashboard" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={20} />
        Início
      </NavLink>
      <NavLink to="/transacoes" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <Receipt size={20} />
        Gastos
      </NavLink>
      <button type="button" className="bnav-fab" aria-label="Novo lançamento" onClick={() => openOverlay('transaction')}>
        <Plus size={24} />
      </button>
      <NavLink to="/categorias" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <Target size={20} />
        Categorias
      </NavLink>
      <NavLink to="/relatorios" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <BarChart3 size={20} />
        Relatórios
      </NavLink>
    </nav>
  )
}

export default BottomNav
