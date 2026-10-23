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
      <div className="topbar-left">
        <div className="topbar-brand mobile-only">
          <div className="brand-mark" style={{ width: 26, height: 26 }}>
            <svg className="icon" style={{ width: 13, height: 13 }}><use href="#i-sparkle" /></svg>
          </div>
        </div>
        <div>
          <p className="page-title">{title}</p>
          <p className="page-sub">{subtitle}</p>
        </div>
      </div>
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="search-trigger desktop-only" onClick={() => openOverlay('cmdk')}>
          <Search size={14} />
          <span>Buscar ou executar</span>
          <kbd className="kbd">/</kbd>
        </button>
        <button
          type="button"
          className="btn-icon mobile-only"
          aria-label="Buscar"
          onClick={() => openOverlay('cmdk')}
          style={{ width: 34, height: 34, borderRadius: 'var(--ds-radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--ds-border)', color: 'var(--ds-foreground)' }}
        >
          <Search size={14} />
        </button>
        <button type="button" className="btn-icon icon-btn" aria-label={`Alertas de orçamento (${count} não lidos)`} onClick={() => openOverlay('notif')} style={{ width: 34, height: 34, position: 'relative' }}>
          <Bell size={16} />
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
          className="btn-icon mobile-only"
          aria-label="Configurações"
          onClick={() => navigate('/configuracoes')}
          title="Menu da conta"
          style={{ width: 30, height: 30, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <Avatar name={user?.displayName || user?.fullName || 'UT'} src={user?.avatarUrl} size={28} />
        </button>
      </div>
    </header>
  )
}

function Dot() {
  return <span className="notif-dot" />
}

export default Topbar
