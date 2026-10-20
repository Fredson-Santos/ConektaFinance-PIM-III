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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 className="card-title" style={{ fontSize: 17 }}>Categorias & Orçamentos</h2>
        <Button icon={Plus} onClick={() => setFormModal({ mode: 'create' })}>
          Nova categoria
        </Button>
      </div>

      <section className="ds-card overview-card" aria-label="Consolidado do mês">
        <div className="overview-top">
          <div>
            <div className="stat-label">Total do mês</div>
            <div className="overview-big">
              {formatCurrency(overview.totalSpent)} <span className="text-faint" style={{ fontSize: 14 }}>de {formatCurrency(overview.totalLimit)}</span>
            </div>
          </div>
          <Badge variant={STATUS_BADGES[overview.status].variant}>{overview.statusLabel}</Badge>
        </div>
        <Meter value={overview.totalSpent} max={overview.totalLimit} tone={overview.status === 'ok' ? null : overview.status} height={10} />
        <div className="stat-foot">
          {formatCurrency(overview.remaining)} livres restantes nos tetos do mês
        </div>
      </section>

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
  const badge = STATUS_BADGES[category.status] || STATUS_BADGES.noLimit
  const spent = category.spent || 0
  const limit = category.limit || 0
  return (
    <article className="ds-card cat-card">
      <div className="cat-card-top">
        <span className="cat-icon" style={{ background: `${category.colorCode}22`, color: category.colorCode, borderColor: `${category.colorCode}55` }}>
          <Icon name={category.icon} size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cat-card-name">{category.name}</div>
          <div className="cat-card-desc">{category.description || 'Sem descrição'}</div>
        </div>
        <button type="button" className="icon-btn" aria-label={`Editar ${category.name}`} onClick={onEdit}>
          ⋯
        </button>
      </div>

      <div className="cat-card-amounts">
        {limit > 0 ? `${formatCurrency(spent)} de ${formatCurrency(limit)}` : `${formatCurrency(spent)} · sem teto`}
      </div>

      {limit > 0 ? (
        <>
          <Meter value={spent} max={limit} tone={category.status} />
          <div className="cat-card-meta">
            <span>
              {spent > limit
                ? `Excesso de ${formatCurrency(spent - limit)}`
                : `Disponível: ${formatCurrency(limit - spent)}`}
            </span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </>
      ) : (
        <div className="cat-card-meta" style={{ justifyContent: 'space-between' }}>
          <span className="text-faint">Nenhum teto configurado</span>
          <Button variant="secondary" onClick={onSetLimit} style={{ minHeight: 32, padding: '4px 12px', fontSize: 12 }}>
            Definir teto
          </Button>
        </div>
      )}

      <button type="button" className="cat-card-link" onClick={onOpenExtrato}>
        ver extrato <ArrowRight size={12} style={{ verticalAlign: -1 }} />
      </button>
    </article>
  )
}

export default BudgetsScreen
