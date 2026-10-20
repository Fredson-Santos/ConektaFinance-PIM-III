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
        <div className="auth-brand-mark" style={{ width: 34, height: 34, borderRadius: 10, fontSize: 14 }}>
          C
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

      <button type="button" className="ds-btn ds-btn-blue side-cta" onClick={() => openOverlay('transaction')}>
        <Plus size={16} />
        Novo lançamento
      </button>

      <div className="sidebar-footer">
        <div className="theme-pill" role="radiogroup" aria-label="Tema">
          <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} aria-label="Tema claro">
            <Sun size={14} /> Claro
          </button>
          <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} aria-label="Tema escuro">
            <Moon size={14} /> Escuro
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <button type="button" className="user-trigger" onClick={() => toggleOverlay('user')} aria-haspopup="menu">
            <Avatar name={user?.displayName || user?.fullName || 'CF'} src={user?.avatarUrl} />
            <span className="user-info">
              <b>{user?.displayName || user?.fullName}</b>
              <span>Conta pessoal</span>
            </span>
          </button>
          <UserPopover onLogout={handleLogout} />
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
