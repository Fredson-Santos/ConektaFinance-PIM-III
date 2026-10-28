import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Target,
  BarChart3,
  Plus,
  Import,
  Sparkles,
  Bell,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { useUi } from '../../context/UiContext'
import { useAuth } from '../../context/AuthContext'

const COMMANDS = [
  { name: 'Ir para Dashboard', icon: LayoutDashboard, hint: 'Página', run: (navigate) => navigate('/dashboard') },
  { name: 'Ir para Gastos', icon: Receipt, hint: 'Página', run: (navigate) => navigate('/transacoes') },
  { name: 'Ir para Categorias', icon: Target, hint: 'Página', run: (navigate) => navigate('/categorias') },
  { name: 'Ir para Relatórios', icon: BarChart3, hint: 'Página', run: (navigate) => navigate('/relatorios') },
  { name: 'Ir para Configurações', icon: Settings, hint: 'Página', run: (navigate) => navigate('/configuracoes') },
  { name: 'Registrar novo lançamento', icon: Plus, hint: 'Ação', run: (_navigate, ui) => ui.openTransactionSheet() },
  { name: 'Importar extrato', icon: Import, hint: 'Ação', run: (_navigate, ui) => ui.openOverlay('import') },
  { name: 'Abrir assistente de IA', icon: Sparkles, hint: 'Ação', run: (_navigate, ui) => ui.openOverlay('ai') },
  { name: 'Ver alertas de orçamento', icon: Bell, hint: 'Ação', run: (_navigate, ui) => ui.openOverlay('notif') },
  { name: 'Ir para Administração', icon: ShieldCheck, hint: 'Página', adminOnly: true, run: (navigate) => navigate('/admin') },
]

export function CommandPalette() {
  const { overlays, closeOverlay, openTransactionSheet, openOverlay } = useUi()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (overlays.cmdk) {
      setQuery('')
      setHighlight(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [overlays.cmdk])

  useEffect(() => {
    if (!overlays.cmdk) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeOverlay('cmdk')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [overlays.cmdk, closeOverlay])

  useEffect(() => {
    const onGlobalKey = (event) => {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
      if (event.key === '/' && !isTyping && !overlays.cmdk) {
        event.preventDefault()
        openOverlay('cmdk')
      }
    }
    document.addEventListener('keydown', onGlobalKey)
    return () => document.removeEventListener('keydown', onGlobalKey)
  }, [overlays.cmdk, openOverlay])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const available = COMMANDS.filter((command) => !command.adminOnly || isAdmin)
    if (!term) return available
    return available.filter((command) => command.name.toLowerCase().includes(term))
  }, [query, isAdmin])

  const execute = (command) => {
    closeOverlay('cmdk')
    command.run(navigate, { openTransactionSheet, openOverlay })
  }

  if (!overlays.cmdk) return null

  return (
    <div className="cmdk-overlay" role="dialog" aria-modal="true" aria-label="Paleta de comandos" onMouseDown={() => closeOverlay('cmdk')}>
      <div className="cmdk-panel" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Buscar páginas, ações ou registros…"
          value={query}
          aria-label="Buscar comandos"
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlight(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setHighlight((current) => Math.min(current + 1, filtered.length - 1))
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setHighlight((current) => Math.max(current - 1, 0))
            }
            if (event.key === 'Enter' && filtered[highlight]) {
              event.preventDefault()
              execute(filtered[highlight])
            }
          }}
        />
        <div className="cmdk-list" role="listbox" aria-label="Comandos">
          {filtered.length === 0 ? (
            <div className="cmdk-empty">Nenhuma ação encontrada</div>
          ) : (
            filtered.map((command, index) => (
              <button
                key={command.name}
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={`cmdk-item ${index === highlight ? 'hi' : ''}`}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => execute(command)}
              >
                <command.icon size={16} />
                {command.name}
                <span className="kbd">{command.hint}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
