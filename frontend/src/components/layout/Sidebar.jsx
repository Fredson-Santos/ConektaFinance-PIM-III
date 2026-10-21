import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, Target, BarChart3, Plus, Sun, Moon, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'
import { Avatar } from '../common/Avatar'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transacoes', label: 'Gastos', icon: Receipt },
  { to: '/categorias', label: 'Categorias', icon: Target },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { openOverlay, toggleOverlay } = useUi()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.push('Sessão encerrada. Até logo!')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L14 9L20 11L14 13L12 19L10 13L4 11L10 9L12 3Z" />
          </svg>
        </div>
        <span className="brand-name">ConektaFinance</span>
      </div>

      <nav className="side-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="side-cta" onClick={() => openOverlay('transaction')}>
        <Plus size={14} />
        Novo lançamento
      </button>

      <div className="sidebar-footer">
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <button type="button" className="user-trigger" onClick={() => toggleOverlay('user')} aria-haspopup="menu" title="Menu da conta">
            <Avatar name={user?.displayName || user?.fullName || 'CF'} src={user?.avatarUrl} />
            <span className="user-info">
              <b>{user?.displayName || user?.fullName || 'Usuário'}</b>
              <span>Conta pessoal</span>
            </span>
          </button>
          <UserPopover onLogout={handleLogout} />
        </div>
        <div className="theme-switch-pill" role="radiogroup" aria-label="Tema">
          <button
            type="button"
            className={`theme-pill-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
            aria-label="Tema claro"
            title="Modo Claro"
          >
            <Sun size={13} />
          </button>
          <button
            type="button"
            className={`theme-pill-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
            aria-label="Tema escuro"
            title="Modo Escuro"
          >
            <Moon size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function UserPopover({ onLogout }) {
  const { overlays, closeOverlay } = useUi()
  const navigate = useNavigate()
  if (!overlays.user) return null
  return (
    <div
      className="popover"
      style={{ position: 'absolute', bottom: 54, left: 0, width: 230 }}
      onMouseLeave={() => closeOverlay('user')}
    >
      <button
        type="button"
        className="cmdk-item"
        onClick={() => {
          closeOverlay('user')
          navigate('/configuracoes')
        }}
      >
        <Settings size={15} /> Configurações
      </button>
      <button type="button" className="cmdk-item" style={{ color: 'var(--ds-red-700)' }} onClick={onLogout}>
        <LogOut size={15} /> Sair da conta
      </button>
    </div>
  )
}

export default Sidebar
