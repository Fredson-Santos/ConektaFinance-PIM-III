import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { categoryService } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { useUi } from '../../context/UiContext'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { Meter } from '../../components/common/Meter'
import { SkeletonCard } from '../../components/common/Skeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { CategoryFormModal } from './CategoryFormModal'
import { SetLimitModal } from './SetLimitModal'
import { formatCurrency } from '../../utils/format'

const STATUS_BADGES = {
  ok: { variant: 'ok', label: 'Sob controle' },
  warn: { variant: 'warn', label: 'Em atenção' },
  over: { variant: 'bad', label: 'Estourado' },
  noLimit: { variant: 'gray', label: 'Sem teto' },
}

export function BudgetsScreen() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const navigate = useNavigate()
  const toast = useToast()
  const { openTransactionSheet } = useUi()
  const [formModal, setFormModal] = useState(null)
  const [limitModal, setLimitModal] = useState(null)

  const { data: categories, loading, error, refetch } = useAsync(
    () => categoryService.list({ month, year }),
    [month, year],
  )

  const overview = useMemo(() => {
    const expenseCategories = (categories || []).filter((category) => category.kind === 'expense')
    const totalLimit = expenseCategories.reduce((sum, category) => sum + (category.limit || 0), 0)
    const totalSpent = expenseCategories.reduce((sum, category) => sum + (category.spent || 0), 0)
    const percentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
    const status = totalLimit === 0 || percentage > 100 ? 'over' : percentage >= 80 ? 'warn' : 'ok'
    const statusLabel =
      percentage > 100 ? `Teto estourado (${percentage}%)` : percentage >= 80 ? `Atenção (${percentage}%)` : `Sob controle (${percentage}%)`
    return { totalLimit, totalSpent, percentage, remaining: Math.max(0, totalLimit - totalSpent), status, statusLabel }
  }, [categories])

  const openExtrato = (category) => {
    navigate(`/transacoes?categoryId=${category.id}`)
  }

  return (
    <>
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--ds-foreground)' }}>Categorias & Orçamentos</div>
          <div className="sub" style={{ fontSize: 13, color: 'var(--ds-foreground-muted)' }}>Acompanhe seus limites mensais e veja o total gasto em todas as categorias</div>
        </div>
        <button type="button" className="btn primary" onClick={() => setFormModal({ mode: 'create' })}>
          <Plus size={14} style={{ marginRight: 6 }} /> Nova categoria
        </button>
      </div>

      <section className="card" aria-label="Consolidado do mês" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          <span className="sub" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ds-foreground-muted)' }}>Total gasto juntando tudo</span>
          <span
            className="badge b-ok"
            style={{
              fontSize: 11.5,
              padding: '3px 10px',
              flexShrink: 0,
              background: overview.status === 'over' ? 'rgba(229, 72, 77, 0.15)' : 'rgba(0, 204, 136, 0.15)',
              color: overview.status === 'over' ? 'var(--ds-red-700)' : 'var(--ds-green-700)',
              border: `1px solid ${overview.status === 'over' ? 'rgba(229, 72, 77, 0.3)' : 'rgba(0, 204, 136, 0.3)'}`,
              borderRadius: 9999,
            }}
          >
            {overview.statusLabel}
          </span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 30, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ds-foreground)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {formatCurrency(overview.totalSpent)}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ds-foreground-muted)', marginTop: 4 }}>
            de um limite total de <strong style={{ color: 'var(--ds-foreground)' }}>{formatCurrency(overview.totalLimit)}</strong>
          </div>
        </div>

        <div className="cat-track" style={{ height: 8, background: 'var(--ds-gray-alpha-200)', borderRadius: 99, overflow: 'hidden' }}>
          <div
            className="cat-fill"
            style={{
              width: `${Math.min(100, overview.percentage)}%`,
              height: '100%',
              background: overview.status === 'over' ? 'var(--ds-red-700)' : 'linear-gradient(90deg, var(--ds-blue-700), var(--ds-green-700))',
              borderRadius: 99,
            }}
          />
        </div>

        <div style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', marginTop: 8, marginBottom: 12 }}>
          {formatCurrency(overview.remaining)} livres restantes
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--ds-foreground-muted)', borderTop: '1px solid var(--ds-gray-alpha-200)', paddingTop: 12 }}>
          {(categories || []).filter((c) => c.kind === 'expense').slice(0, 5).map((c) => (
            <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.colorCode || '#0084ff' }} />
              {c.name}: <strong style={{ color: 'var(--ds-foreground)' }}>{formatCurrency(c.spent || 0)}</strong>
            </span>
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--ds-foreground)' }}>Categorias</h2>
        <span className="sub" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>
          {(categories || []).filter((c) => c.kind === 'expense').length} cadastradas
        </span>
      </div>

      {loading ? (
        <div className="cat-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} height={110} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <div className="cat-grid">
          {(categories || [])
            .filter((category) => category.kind === 'expense')
            .map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onOpenExtrato={() => openExtrato(category)}
                onSetLimit={() => setLimitModal(category)}
                onEdit={() => setFormModal({ mode: 'edit', category })}
              />
            ))}
        </div>
      )}

      {formModal ? (
        <CategoryFormModal
          modal={formModal}
          onClose={() => setFormModal(null)}
          onSaved={() => {
            setFormModal(null)
            toast.push('Categoria salva com sucesso!')
            refetch()
          }}
          onDeleted={() => {
            setFormModal(null)
            toast.push('Categoria excluída.')
            refetch()
          }}
          onConflict={(message) => setFormModal({ ...formModal, conflict: message })}
        />
      ) : null}

      {limitModal ? (
        <SetLimitModal
          category={limitModal}
          month={month}
          year={year}
          onClose={() => setLimitModal(null)}
          onSaved={() => {
            setLimitModal(null)
            toast.push('Teto orçamentário atualizado!')
            refetch()
          }}
        />
      ) : null}
    </>
  )
}

function CategoryCard({ category, onOpenExtrato, onSetLimit, onEdit }) {
  const spent = category.spent || 0
  const limit = category.limit || 0
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : null
  const isOver = pct && pct > 100
  const isWarn = pct && pct >= 80 && pct <= 100
  const barColor = isOver ? 'var(--ds-red-700, #e5484d)' : isWarn ? 'var(--ds-amber-500, #f5a623)' : (category.colorCode || '#0084ff')
  const remaining = limit > 0 ? Math.max(0, limit - spent) : null

  return (
    <div className="cat-card" style={{ cursor: 'pointer' }} onClick={onOpenExtrato}>
      <div className="cat-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="cat-icon-wrap" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--ds-radius-lg)', background: 'var(--ds-gray-alpha-200)', border: '1px solid var(--ds-border)' }}>
          <Icon name={category.icon || 'tag'} size={16} style={{ color: category.colorCode || '#0084ff' }} />
        </span>
        <span
          className={`badge ${isOver ? 'b-bad' : isWarn ? 'b-warn' : limit > 0 ? 'b-ok' : ''}`}
          style={{
            fontSize: 10.5,
            padding: '2px 8px',
            borderRadius: 9999,
            background: isOver ? 'rgba(229, 72, 77, 0.15)' : isWarn ? 'rgba(245, 166, 35, 0.15)' : limit > 0 ? 'rgba(0, 204, 136, 0.15)' : 'var(--ds-gray-alpha-100)',
            color: isOver ? 'var(--ds-red-700)' : isWarn ? 'var(--ds-amber-500)' : limit > 0 ? 'var(--ds-green-700)' : 'var(--ds-foreground-muted)',
            border: `1px solid ${isOver ? 'rgba(229, 72, 77, 0.3)' : isWarn ? 'rgba(245, 166, 35, 0.3)' : limit > 0 ? 'rgba(0, 204, 136, 0.3)' : 'var(--ds-border)'}`,
          }}
        >
          {isOver ? 'Estourado' : isWarn ? 'Em Atenção' : limit > 0 ? 'Sob controle' : 'Sem teto'}
        </span>
      </div>

      <p className="cat-card-name" style={{ fontSize: 14.5, fontWeight: 600, margin: '0 0 4px', color: 'var(--ds-foreground)' }}>
        {category.name}
      </p>
      <p className="cat-card-desc" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', margin: '0 0 12px' }}>
        {category.description || 'Sem descrição'}
      </p>

      {limit > 0 ? (
        <>
          <div className="cat-card-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5, marginBottom: 6 }}>
            <span className="cat-limit-val num" style={{ fontWeight: 600, color: 'var(--ds-foreground)' }}>
              {formatCurrency(spent)}{' '}
              <span style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--ds-foreground-muted)' }}>
                / {formatCurrency(limit)}
              </span>
            </span>
            <span className="cat-pct-val num" style={{ fontWeight: 600, color: barColor }}>
              {pct}%
            </span>
          </div>
          <div className="mini-bar" style={{ height: 6, background: 'var(--ds-gray-alpha-200)', borderRadius: 99, overflow: 'hidden' }}>
            <div className="mini-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--ds-foreground-muted)' }}>
            <span>{isOver ? `Excesso de ${formatCurrency(spent - limit)}` : `Disponível: ${formatCurrency(remaining)}`}</span>
            <span style={{ color: 'var(--ds-blue-600)', fontWeight: 500 }}>ver extrato →</span>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--ds-gray-alpha-100)', borderRadius: 'var(--ds-radius-sm)', fontSize: 11.5, color: 'var(--ds-foreground-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Nenhum teto configurado</span>
          <button
            type="button"
            className="touch-target"
            style={{ color: 'var(--ds-link)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              onSetLimit()
            }}
          >
            Definir teto
          </button>
        </div>
      )}
    </div>
  )
}

export default BudgetsScreen
