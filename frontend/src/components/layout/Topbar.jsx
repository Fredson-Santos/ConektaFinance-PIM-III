import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Import, Plus } from 'lucide-react'
import { useUi } from '../../context/UiContext'
import { useAuth } from '../../context/AuthContext'
import { useUnreadAlerts } from '../../hooks/useUnreadAlerts'
import { Avatar } from '../common/Avatar'

const PAGE_META = {
  '/dashboard': ['Dashboard', 'Sua visão geral financeira'],
  '/transacoes': ['Histórico de gastos', 'Todos os seus lançamentos'],
  '/categorias': ['Categorias & Orçamentos', 'Tetos e consumo por categoria'],
  '/relatorios': ['Relatórios', 'Análises e evolução financeira'],
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
  return (
    <span
      style={{
        position: 'absolute',
        top: 7,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--ds-red-700)',
        border: '2px solid var(--ds-background-100)',
      }}
    />
  )
}

export default Topbar
