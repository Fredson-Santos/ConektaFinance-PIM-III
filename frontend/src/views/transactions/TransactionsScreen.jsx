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

  const budgets = budgetsState.data || []
  const totalLimit = budgets.reduce((sum, b) => sum + (b.limitValue || 0), 0) || 6350
  const sideCardSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0) || 2168.90
  const totalSpent = listState.data?.totalSum != null ? Math.abs(listState.data.totalSum) : 2168.90
  const percentage = totalLimit > 0 ? Math.round((sideCardSpent / totalLimit) * 100) : 34

  const rawTop = topCategoriesState.data || []
  const topItems = rawTop.length > 0 ? rawTop.slice(0, 4) : [
    { name: 'Moradia & Contas', total: 1450, colorCode: '#0070f3' },
    { name: 'Alimentação & Mercado', total: 268, colorCode: '#f5a623' },
    { name: 'Transporte', total: 90, colorCode: '#8e4ec6' },
    { name: 'Lazer & Cultura', total: 78, colorCode: '#e93d82' },
  ]

  return (
    <div className="gastos-container">
      <div className="gastos-layout">
        {/* COLUNA PRINCIPAL: Feed de Transações & Filtros */}
        <div className="gastos-main-col">
          <div className="gastos-top desktop-only" style={{ marginBottom: 16 }}>
            <h2 className="gastos-desktop-heading" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ds-foreground)', letterSpacing: '-0.02em' }}>
              Histórico de Gastos
            </h2>
          </div>

          <div className="search" style={{ position: 'relative', marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-foreground-muted)' }}>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              className="ds-input"
              id="q"
              type="search"
              placeholder="Buscar por descrição"
              aria-label="Buscar transações"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>

          <div className="chips" id="chips" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            <button type="button" className={`chip ${!categoryId ? 'on' : ''}`} onClick={() => setCategoryId('')}>
              Todas
            </button>
            {(categories || []).map((category) => (
              <button
                key={category.id}
                type="button"
                className={`chip ${String(category.id) === String(categoryId) ? 'on' : ''}`}
                onClick={() => setCategoryId(String(category.id))}
              >
                <b style={{ background: category.colorCode || '#888' }} />
                {category.name}
              </button>
            ))}
          </div>

          <div className="summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div className="sub" id="sum-label" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', marginBottom: 2 }}>
                {summaryLabel}
              </div>
              <div className="big" id="sum-val" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ds-foreground)', letterSpacing: '-0.02em' }}>
                {formatCurrency(totalSpent)}
              </div>
            </div>
            <span
              className="badge b-warn"
              id="sum-count"
              style={{
                background: 'rgba(245, 166, 35, 0.15)',
                color: 'var(--ds-amber-500, #f5a623)',
                border: '1px solid rgba(245, 166, 35, 0.3)',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '11.5px',
                fontWeight: 500,
              }}
            >
              {listState.data?.meta
                ? `${listState.data.meta.totalItems} lançamento${listState.data.meta.totalItems === 1 ? '' : 's'}`
                : '10 transações'}
            </span>
          </div>

          <div className="gastos-month-row" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '6px 0 14px' }}>
            <div className="month" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ds-background-100)', border: '1px solid var(--ds-border)', borderRadius: 'var(--ds-radius-md)', padding: '3px 8px' }}>
              <button
                type="button"
                className="btn-icon"
                id="btnGastosPrevMonth"
                aria-label="Mês anterior"
                style={{ width: 26, height: 26, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => changeMonth(-1)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <span id="gastosMonthText" style={{ fontSize: 13, fontWeight: 600, minWidth: 64, textAlign: 'center', color: 'var(--ds-foreground)' }}>
                {monthLabel(period.month, period.year)}
              </span>
              <button
                type="button"
                className="btn-icon"
                id="btnGastosNextMonth"
                aria-label="Próximo mês"
                style={{ width: 26, height: 26, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => changeMonth(1)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {listState.loading ? (
            <SkeletonRows rows={5} />
          ) : listState.error ? (
            <ErrorState message={listState.error.message} onRetry={listState.refetch} />
          ) : groups.length === 0 ? (
            <div className="empty" id="empty" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ds-foreground-muted)' }}>
              <strong style={{ display: 'block', color: 'var(--ds-foreground)', marginBottom: 6 }}>Nenhuma transação encontrada</strong>
              Tente outro termo ou escolha outra categoria.
            </div>
          ) : (
            <div id="groups" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {groups.map((group) => (
                <div className="tx-group" key={group.label}>
                  <div className="tx-group-head" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ds-foreground-muted)', marginBottom: 8 }}>
                    <span>{group.label}</span>
                    <span className="tx-group-sum num">
                      {formatCurrency(Math.abs(group.total), { signed: group.total < 0 })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.items.map((item) => (
                      <TransactionRow key={item.id} transaction={item} onClick={() => openDetail(item)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUNA LATERAL DESKTOP: Painéis de Inteligência e Resumo Financeiro */}
        <aside className="gastos-side-col desktop-only" aria-label="Resumo e Ações de Gastos">
          {/* Card: Consumo do Limite */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ds-foreground)' }}>Consumo do Limite</span>
              <span
                className="badge b-ok"
                style={{
                  fontSize: 11,
                  background: percentage > 100 ? 'rgba(229, 72, 77, 0.15)' : 'rgba(0, 204, 136, 0.15)',
                  color: percentage > 100 ? 'var(--ds-red-700)' : 'var(--ds-green-700)',
                  border: `1px solid ${percentage > 100 ? 'rgba(229, 72, 77, 0.3)' : 'rgba(0, 204, 136, 0.3)'}`,
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontWeight: 500,
                }}
              >
                {percentage > 100 ? 'Estourado' : percentage >= 80 ? 'Atenção' : 'Sob controle'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span id="gastosDesktopTotalVal" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ds-foreground)' }}>
                {formatCurrency(sideCardSpent)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>Meta: {formatCurrency(totalLimit)}</span>
            </div>
            <div className="cat-track" style={{ height: 7, background: 'var(--ds-gray-alpha-200)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
              <div
                className="cat-fill"
                style={{
                  width: `${Math.min(100, percentage)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f5a623, #e93d82)',
                  borderRadius: 99,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--ds-foreground-muted)' }}>
              <span>{percentage}% do limite mensal utilizado</span>
              <span>Média: {formatCurrency(sideCardSpent / 30)}/dia</span>
            </div>
          </div>

          {/* Card: Maiores Categorias */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ds-foreground)' }}>Maiores Categorias</span>
              <button
                type="button"
                style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/categorias')}
              >
                ver detalhes
              </button>
            </div>

            <div className="cat-meter-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topItems.map((item) => {
                const pct = totalSpent > 0 ? Math.round((item.total / totalSpent) * 100) : 0
                const color = item.colorCode || (item.name.toLowerCase().includes('morad') ? '#0070f3' : item.name.toLowerCase().includes('alim') ? '#f5a623' : item.name.toLowerCase().includes('trans') ? '#8e4ec6' : '#e93d82')
                return (
                  <div className="cat-meter-item" key={item.categoryId || item.name}>
                    <div className="cat-meter-head" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span className="cat-meter-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="cat-meter-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        {item.name}
                      </span>
                      <span className="cat-meter-val num" style={{ fontWeight: 500 }}>
                        {formatCurrency(item.total)} ({pct}%)
                      </span>
                    </div>
                    <div className="cat-track" style={{ height: 6, background: 'var(--ds-gray-alpha-200)', borderRadius: 99, overflow: 'hidden' }}>
                      <div className="cat-fill" style={{ width: `${Math.min(100, Math.max(10, pct))}%`, height: '100%', background: color, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card: Gestão de Despesas */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ds-foreground)', marginBottom: 12 }}>
              Gestão de Despesas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="btn primary"
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={() => openTransactionSheet()}
              >
                <svg className="icon" style={{ width: 14, height: 14 }}>
                  <use href="#i-plus" />
                </svg>
                Novo lançamento
              </button>
              <button
                type="button"
                className="btn"
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={() => openOverlay('import')}
              >
                <svg className="icon" style={{ width: 14, height: 14 }}>
                  <use href="#i-upload" />
                </svg>
                Importar extrato (OFX/CSV)
              </button>
              <button
                type="button"
                className="btn"
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={() => navigate('/relatorios')}
              >
                <svg className="icon" style={{ width: 14, height: 14 }}>
                  <use href="#i-chart" />
                </svg>
                Relatório mensal detalhado
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
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

export default TransactionsScreen
