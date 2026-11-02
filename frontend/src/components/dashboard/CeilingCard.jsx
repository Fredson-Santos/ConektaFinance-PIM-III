import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { userService } from '../../services'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { MoneyText } from '../common/MoneyText'
import { formatCurrency } from '../../utils/format'
import { maskMoney, moneyToMask, parseMoneyInput } from '../../utils/money'

export function ceilingStatus(percentage) {
  if (percentage >= 100) return { tone: 'over', label: 'Limite atingido' }
  if (percentage >= 80) return { tone: 'warn', label: 'Atenção' }
  return { tone: 'ok', label: 'Saudável' }
}

export function ceilingUsage(spent, ceiling) {
  const safeSpent = Math.max(0, Number(spent) || 0)
  const safeCeiling = Math.max(0, Number(ceiling) || 0)
  if (safeCeiling === 0) return { percentage: 0, remaining: 0, exceeded: 0, hasCeiling: false }
  const percentage = (safeSpent / safeCeiling) * 100
  return {
    percentage,
    remaining: Math.max(0, safeCeiling - safeSpent),
    exceeded: Math.max(0, safeSpent - safeCeiling),
    hasCeiling: true,
  }
}

// Card "Consumo do Limite": despesas do mês comparadas ao teto global definido no onboarding.
export function CeilingCard({ spent, loading = false, caption = 'Despesas do mês atual', className = '' }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const ceiling = user?.monthlyCeiling || 0
  const usage = ceilingUsage(spent, ceiling)
  const status = ceilingStatus(usage.percentage)
  const shownPct = Math.round(usage.percentage)

  return (
    <section className={`card ceiling-card ${className}`} aria-label="Consumo do Limite" data-tone={usage.hasCeiling ? status.tone : 'none'}>
      <div className="ceiling-head">
        <span className="ceiling-title">Consumo do Limite</span>
        <div className="ceiling-head-actions">
          <span className="ceiling-badge">{usage.hasCeiling ? status.label : 'Sem teto'}</span>
          <button
            type="button"
            className="ceiling-edit"
            aria-label="Editar teto mensal"
            title="Editar teto mensal"
            onClick={() => setEditing(true)}
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      <div className="ceiling-values">
        <span className="ceiling-spent num" data-testid="ceiling-spent">
          {loading ? '—' : <MoneyText value={spent || 0} />}
        </span>
        <span className="ceiling-meta">
          {usage.hasCeiling ? (
            <>
              de <MoneyText value={ceiling} />
            </>
          ) : (
            'Teto não definido'
          )}
        </span>
      </div>

      <div
        className="ceiling-track"
        role="progressbar"
        aria-label="Percentual do teto consumido"
        aria-valuenow={Math.min(100, shownPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="ceiling-fill" style={{ width: `${loading ? 0 : Math.min(100, usage.percentage)}%` }} />
      </div>

      <div className="ceiling-foot">
        {usage.hasCeiling ? (
          <>
            <span>{loading ? '—' : `${shownPct}% do teto utilizado`}</span>
            <span className={usage.exceeded > 0 ? 'ceiling-exceeded' : undefined}>
              {loading ? null : usage.exceeded > 0 ? (
                <>
                  Excedido em <MoneyText value={usage.exceeded} />
                </>
              ) : (
                <>
                  Restam <MoneyText value={usage.remaining} />
                </>
              )}
            </span>
          </>
        ) : (
          <button type="button" className="ceiling-define" onClick={() => setEditing(true)}>
            Definir teto mensal
          </button>
        )}
      </div>
      <span className="ceiling-caption">{caption}</span>

      <EditCeilingModal open={editing} current={ceiling} onClose={() => setEditing(false)} />
    </section>
  )
}

function EditCeilingModal({ open, current, onClose }) {
  return (
    <Modal open={open} title="Teto mensal de gastos" onClose={onClose}>
      {open ? <EditCeilingForm current={current} onClose={onClose} /> : null}
    </Modal>
  )
}

function EditCeilingForm({ current, onClose }) {
  const { refreshUser } = useAuth()
  const toast = useToast()
  const [text, setText] = useState(() => (current > 0 ? moneyToMask(current) : ''))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const save = async (event) => {
    event.preventDefault()
    const value = parseMoneyInput(text)
    if (!value) {
      setError('Informe um teto maior que R$ 0,00.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await userService.updatePreferences({ monthlyCeiling: value })
      await refreshUser()
      toast.push(`Teto mensal atualizado para ${formatCurrency(value)}.`)
      onClose()
    } catch (caught) {
      setError(caught.message || 'Não foi possível atualizar o teto.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
      <div className="ds-form-group">
        <label className="ds-label" htmlFor="ceiling-input">Novo teto mensal (R$)</label>
        <input
          id="ceiling-input"
          className={`ds-input num ${error ? 'ds-input-error' : ''}`}
          inputMode="numeric"
          placeholder="0,00"
          autoFocus
          value={text}
          onChange={(event) => setText(maskMoney(event.target.value))}
        />
        {error ? <span className="ds-error">{error}</span> : <span className="ds-hint">O percentual de consumo é recalculado na hora.</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" loading={saving}>Salvar teto</Button>
      </div>
    </form>
  )
}

export default CeilingCard
