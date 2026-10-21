import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Import, Plus } from 'lucide-react'
import { useUi } from '../../context/UiContext'
import { useAuth } from '../../context/AuthContext'
import { useUnreadAlerts } from '../../hooks/useUnreadAlerts'
import { Avatar } from '../common/Avatar'

const PAGE_META = {
  '/dashboard': ['Dashboard', 'Sua visão geral financeira'],
  '/transacoes': ['Gastos', 'Gerencie todas as suas despesas'],
  '/categorias': ['Categorias', 'Organize suas despesas e limites por categoria'],
  '/relatorios': ['Relatórios', 'Balanço semestral & inteligência preditiva · Abril a Setembro de 2026'],
  '/configuracoes': ['Configurações', 'Perfil, segurança e privacidade'],
}

export function Topbar() {
  const { openOverlay, overlays } = useUi()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { count } = useUnreadAlerts()
  const [title, subtitle] = PAGE_META[pathname] || PAGE_META['/dashboard']

  return (
    <header className="topbar">
      <div>
        <div className="page-title">{title}</div>
        <div className="page-sub">{subtitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="search-trigger desktop-only" onClick={() => openOverlay('cmdk')}>
          <Search size={14} />
          <span>Buscar ou executar</span>
          <kbd className="kbd">/</kbd>
        </button>
        <button type="button" className="icon-btn" aria-label={`Alertas de orçamento (${count} não lidos)`} onClick={() => openOverlay('notif')}>
          <Bell size={18} />
          {count > 0 ? <Dot /> : null}
        </button>
        <button type="button" className="btn desktop-only" aria-label="Importar extrato" onClick={() => openOverlay('import')}>
          <Import size={14} /> Importar
        </button>
        <button type="button" className="btn primary desktop-only" onClick={() => openOverlay('transaction')}>
          <Plus size={14} /> Novo lançamento
        </button>
        <button
          type="button"
          className="icon-btn mobile-only"
          aria-label="Configurações"
          onClick={() => navigate('/configuracoes')}
        >
          <Avatar name={user?.displayName || user?.fullName || 'CF'} src={user?.avatarUrl} size={26} />
        </button>
      </div>
    </header>
  )
}

function Dot() {
  return <span className="notif-dot" />
}

export default Topbar
