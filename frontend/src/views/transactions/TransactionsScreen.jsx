import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, BarChart3, Import } from 'lucide-react'
import { transactionService, categoryService, budgetService, reportService } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'
import { Chip } from './chips'
import { TransactionRow } from '../../components/transactions/TransactionRow'
import { SkeletonRows } from '../../components/common/Skeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { Meter } from '../../components/common/Meter'
import { Button } from '../../components/common/Button'
import { formatCurrency } from '../../utils/format'
import { formatDayLabel, monthLabel, addMonths } from '../../utils/dates'

export function TransactionsScreen() {
  const now = new Date()
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useCategoryIdFromUrl()
  const { openTransactionSheet, openOverlay } = useUi()
  const toast = useToast()
  const navigate = useNavigate()

  const { data: categories } = useAsync(() => categoryService.list({ kind: 'expense' }), [])

  const listState = useAsync(
    async () => {
      const { data, headers } = await transactionService.list({
        month: period.month,
        year: period.year,
        categoryId: categoryId || undefined,
        search: search || undefined,
        pageSize: 100,
      })
      return { items: data.items, meta: data.meta, totalSum: Number(headers.get('X-Total-Sum') || 0) }
    },
    [period.month, period.year, categoryId, search],
  )

  const budgetsState = useAsync(
    () => budgetService.list(period.month, period.year),
    [period.month, period.year],
  )
  const topCategoriesState = useAsync(
    async () => {
      const start = new Date(period.year, period.month - 1, 1)
      const end = new Date(period.year, period.month, 1)
      return reportService.byCategory(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10))
    },
    [period.month, period.year],
  )

  const groups = useMemo(() => {
    const byDay = new Map()
    for (const item of listState.data?.items || []) {
      const label = formatDayLabel(item.transactionDate)
      if (!byDay.has(label)) byDay.set(label, { label, total: 0, items: [] })
      const group = byDay.get(label)
      group.total += item.type === 'expense' ? -item.value : item.value
      group.items.push(item)
    }
    return [...byDay.values()]
  }, [listState.data])

  const changeMonth = (delta) => setPeriod((current) => addMonths(current.month, current.year, delta))
  const filteredByChip = categoryId && (categories || []).find((category) => category.id === Number(categoryId))
  const summaryLabel = filteredByChip ? `Gastos em ${filteredByChip.name}` : 'Transações do período'

  const openDetail = (transaction) => {
    openTransactionSheet({ editing: transaction })
  }

  return (
    <>
      <div className="gastos-header">
        <div>
          <h2 className="card-title" style={{ fontSize: 17 }}>Histórico de gastos</h2>
          <div className="page-sub">Busque, filtre e navegue pelos meses</div>
        </div>
        <div className="month-nav" aria-label="Navegação de mês">
          <button type="button" aria-label="Mês anterior" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={16} />
          </button>
          <span>{monthLabel(period.month, period.year)}</span>
          <button type="button" aria-label="Próximo mês" onClick={() => changeMonth(1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="gastos-layout">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="search"
            className="ds-input"
            placeholder="Buscar por descrição…"
            value={search}
            aria-label="Buscar transações"
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 360 }}
          />

          <div className="chips" role="tablist" aria-label="Filtrar por categoria">
            <Chip active={!categoryId} onClick={() => setCategoryId('')}>
              Todas
            </Chip>
            {(categories || []).map((category) => (
              <Chip
                key={category.id}
                active={String(category.id) === String(categoryId)}
                onClick={() => setCategoryId(String(category.id))}
              >
                {category.name}
              </Chip>
            ))}
          </div>

          <div className="summary-bar">
            <b style={{ fontSize: 13 }}>{summaryLabel}</b>
            <span className="num" style={{ marginLeft: 'auto', fontWeight: 600 }}>
              {formatCurrency(Math.abs(listState.data?.totalSum || 0), {
                signed: (listState.data?.totalSum || 0) < 0,
              })}
            </span>
            <span className="ds-badge ds-badge-gray">
              {listState.data?.meta.totalItems ?? 0} lançamento{(listState.data?.meta.totalItems || 0) === 1 ? '' : 's'}
            </span>
          </div>

          {listState.loading ? (
            <SkeletonRows rows={5} />
          ) : listState.error ? (
            <ErrorState message={listState.error.message} onRetry={listState.refetch} />
          ) : groups.length === 0 ? (
            <EmptyState
              title="Nenhuma transação encontrada"
              description="Tente outro termo, escolha outra categoria ou registre um novo lançamento."
              action={
                <Button icon={Search} onClick={() => { setSearch(''); setCategoryId('') }}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            groups.map((group) => (
              <div className="tx-group" key={group.label}>
                <div className="tx-group-head">
                  <span>{group.label}</span>
                  <span className="tx-group-sum">
                    {formatCurrency(Math.abs(group.total), { signed: group.total < 0 })}
                  </span>
                </div>
                {group.items.map((item) => (
                  <TransactionRow key={item.id} transaction={item} onClick={() => openDetail(item)} />
                ))}
              </div>
            ))
          )}
        </section>

        <aside className="gastos-side-col desktop-only" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LimitUsageCard state={budgetsState} />
          <TopCategoriesCard state={topCategoriesState} />
          <div className="ds-card side-card">
            <div className="side-card-title">Gestão de despesas</div>
            <div className="quick-actions">
              <button type="button" className="quick-action" onClick={() => openTransactionSheet()}>
                <span className="qa-icon">＋</span> Registrar novo lançamento
              </button>
              <button type="button" className="quick-action" onClick={() => openOverlay('import')}>
                <span className="qa-icon"><Import size={15} /></span> Importar extrato
              </button>
              <button type="button" className="quick-action" onClick={() => navigate('/relatorios')}>
                <span className="qa-icon"><BarChart3 size={15} /></span> Ver relatórios mensais
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function useCategoryIdFromUrl() {
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('categoryId') || ''
  const setCategoryId = (value) => {
    const next = new URLSearchParams(params)
    if (value) next.set('categoryId', value)
    else next.delete('categoryId')
    setParams(next, { replace: true })
  }
  return [categoryId, setCategoryId]
}

function LimitUsageCard({ state }) {
  const budgets = state.data || []
  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limitValue, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const percentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
  const tone = percentage > 100 ? 'over' : percentage >= 80 ? 'warn' : null
  return (
    <div className="ds-card side-card">
      <div className="side-card-title">Consumo do limite</div>
      <div className="overview-big" style={{ fontSize: 20 }}>
        {formatCurrency(totalSpent)}
      </div>
      <div className="stat-foot">Meta mensal de {formatCurrency(totalLimit)} · {percentage}%</div>
      <Meter value={totalSpent} max={totalLimit} tone={tone} />
      <div className="stat-foot">
        Média de {formatCurrency(totalLimit > 0 ? totalSpent / 30 : 0)} por dia
      </div>
    </div>
  )
}

function TopCategoriesCard({ state }) {
  const items = (state.data || []).slice(0, 4)
  const max = Math.max(...items.map((item) => item.total), 1)
  if (items.length === 0) {
    return (
      <div className="ds-card side-card">
        <div className="side-card-title">Maiores categorias</div>
        <span className="text-faint" style={{ fontSize: 12 }}>
          Registre gastos para ver o ranking do mês.
        </span>
      </div>
    )
  }
  return (
    <div className="ds-card side-card">
      <div className="side-card-title">Maiores categorias</div>
      {items.map((item) => (
        <div className="cat-meter-item" key={item.categoryId}>
          <div className="cat-meter-top">
            <b>{item.name}</b>
            <span>{formatCurrency(item.total)}</span>
          </div>
          <Meter value={item.total} max={max} height={6} />
        </div>
      ))}
    </div>
  )
}

export default TransactionsScreen
