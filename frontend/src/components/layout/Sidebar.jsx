import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, Target, BarChart3, Sun, Moon, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'
import { Avatar } from '../common/Avatar'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: () => (
      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" rx="1.6" />
        <rect x="13" y="3" width="8" height="5" rx="1.6" />
        <rect x="13" y="11" width="8" height="10" rx="1.6" />
        <rect x="3" y="13" width="8" height="8" rx="1.6" />
      </svg>
    ),
  },
  {
    to: '/transacoes',
    label: 'Gastos',
    icon: () => (
      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3H18V21L15.5 19L13 21L11 19L8.5 21L6 19V3Z" />
        <path d="M9 8H15M9 12H15M9 16H13" />
      </svg>
    ),
  },
  {
    to: '/categorias',
    label: 'Categorias',
    icon: () => (
      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 3H4V10L14 20L21 13L11 3Z" />
        <circle cx="8" cy="7" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: () => (
      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20V11M12 20V4M20 20V14" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { openOverlay, toggleOverlay, overlays } = useUi()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.push('Sessão encerrada. Até logo!')
    navigate('/login')
  }

  const fullName = user?.fullName || 'Usuário Teste'
  const name = user?.fullName || user?.displayName || 'Usuário Teste'
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'UT'

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
            <item.icon />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-menu-wrap" id="userMenuWrap">
          <button
            type="button"
            className={`user-trigger ${overlays.user ? 'active' : ''}`}
            onClick={() => toggleOverlay('user')}
            aria-haspopup="menu"
            title="Menu da conta"
          >
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <p className="user-name">{name}</p>
              <p className="user-role">Conta pessoal</p>
            </div>
            <svg className="icon user-chevron" style={{ width: 12, height: 12, marginLeft: 'auto' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9L12 15L18 9" />
            </svg>
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
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!overlays.user) return null
  return (
    <div className="user-popover open" id="userPopover">
      <div className="user-popover-header">
        <p className="user-popover-name">{user?.displayName || user?.fullName || 'Usuário Teste'}</p>
        <p className="user-popover-email">{user?.email || 'usuario@conektafinance.com'}</p>
      </div>
      <div className="user-popover-divider" />
      <button
        type="button"
        className="user-popover-item"
        onClick={() => {
          closeOverlay('user')
          navigate('/configuracoes')
        }}
      >
        <Settings size={14} className="icon" />
        <span>Configurações</span>
      </button>
      <div className="user-popover-divider" />
      <button type="button" className="user-popover-item danger" onClick={onLogout}>
        <LogOut size={14} className="icon" />
        <span>Sair</span>
      </button>
    </div>
  )
}

export default Sidebar
