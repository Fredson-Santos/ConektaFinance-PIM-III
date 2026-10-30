import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Sparkles } from 'lucide-react'
import { dashboardService, insightService } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../context/AuthContext'
import { useUi } from '../../context/UiContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { WEEKDAY_KEYS, isSameWeekday, useToday } from '../../hooks/useToday'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { SkeletonCard, SkeletonRows } from '../../components/common/Skeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { TransactionRow } from '../../components/transactions/TransactionRow'
import { MoneyText } from '../../components/common/MoneyText'
import { formatCurrency, formatPercent } from '../../utils/format'
import { formatDayLabel } from '../../utils/dates'
import { Icon } from '../../components/common/Icon'

export function DashboardScreen() {
  const isMobile = useMediaQuery('(max-width: 880px)')
  return isMobile ? <MobileDashboard /> : <DesktopDashboard />
}

function useDashboardData() {
  const { dataVersion } = useUi()
  const overview = useAsync(() => dashboardService.overview(), [dataVersion])
  const week = useAsync(() => dashboardService.weeklyExpenses(), [dataVersion])
  const recent = useAsync(() => dashboardService.recentTransactions(5), [dataVersion])
  const meters = useAsync(() => dashboardService.budgetMeters(), [dataVersion])
  const insights = useAsync(() => insightService.list(), [])
  return { overview, week, recent, meters, insights }
}

function MobileDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { openOverlay, openTransactionSheet } = useUi()
  const { overview, week, recent, meters, insights } = useDashboardData()

  if (overview.error) return <ErrorState message={overview.error.message} onRetry={overview.refetch} />

  const firstName = (user?.displayName || user?.fullName || 'você').split(' ')[0]
  const insight = (insights.data || [])[0]
  const recentList = recent.data || []
  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const previousMonthName = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('pt-BR', { month: 'long' })
  const negativeBalance = (overview.data?.balance ?? 0) < 0

  const meterItems = (meters.data || []).map((m) => ({
    name: m.name,
    spent: m.spent,
    limit: m.limit,
    percentage: m.percentage,
    color: m.colorCode || '#0084ff',
  }))

  return (
    <div className="mobile-dash-content">
      <p className="hello" id="mobileGreeting">Olá, {firstName}</p>

      {/* Saldo Oficial Mobile */}
      <section className="balance" aria-label="Saldo do mês">
        <div className="label">Saldo em {currentMonthName}</div>
        <div className="value">
          {overview.loading ? (
            <span id="valSaldoMobile">—</span>
          ) : (
            <span
              id="valSaldoMobile"
              style={negativeBalance ? { color: 'var(--ds-red-700)' } : undefined}
            >
              {formatCurrency(overview.data.balance, { signed: true })}
            </span>
          )}
        </div>
        <div className="delta">
          <span className={`badge ${(overview.data?.incomeChangePct || 0) >= 0 && !negativeBalance ? 'badge-success' : 'badge-danger'}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span id="badgeDeltaVal">
              {overview.data?.incomeChangePct != null
                ? `${formatPercent(overview.data.incomeChangePct, { signed: true, decimals: 1 })} vs mês anterior`
                : 'Primeiro mês de uso'}
            </span>
          </span>
          {' a mais que em ' + previousMonthName}
        </div>
      </section>

      {/* Entradas e Saídas do Mês */}
      <section className="flow" aria-label="Entradas e saídas do mês">
        <div className="card in">
          <div className="k">
            <i>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M8 7h9v9" />
              </svg>
            </i>
            Entradas
          </div>
          <div className="v" id="valEntradasMobile">
            {overview.loading ? '—' : formatCurrency(overview.data.income)}
          </div>
        </div>
        <div className="card out">
          <div className="k">
            <i>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 7L7 17M16 17H7V8" />
              </svg>
            </i>
            Saídas
          </div>
          <div className="v" id="valDespesasMobile">
            {overview.loading ? '—' : formatCurrency(overview.data.expense)}
          </div>
        </div>
      </section>

      {/* Gráfico de Gastos da Semana */}
      <WeekChart week={week} isMobile />

      {/* Assistente IA Copilot */}
      <section className="sec ai-sec">
        <div className="card ai">
          <div className="ico">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
              <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
            </svg>
          </div>
          <div>
            <p>
              {insight ? insight.description : 'Você gastou 32% a mais com alimentação do que na média dos últimos 3 meses.'}{' '}
              <span>Quer ver onde foi?</span>
            </p>
            <div className="chips">
              <button type="button" className="chip" id="btnAiMobileDetails" onClick={() => openOverlay('ai')}>
                Ver detalhes
              </button>
              <button type="button" className="chip" onClick={() => navigate('/categorias')}>
                Criar limite
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="sec">
        <div className="sec-head">
          <h2>Categorias</h2>
          <button type="button" className="link" onClick={() => navigate('/categorias')}>
            Ver todas
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="card cats" id="mobileCatList">
          {meterItems.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ds-foreground-muted)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span>Nenhum orçamento configurado</span>
              <button
                type="button"
                className="btn"
                style={{ fontSize: 12.5, height: 32, padding: '0 12px' }}
                onClick={() => navigate('/categorias')}
              >
                <Plus size={14} style={{ marginRight: 6 }} />
                Adicionar categoria
              </button>
            </div>
          ) : (
            meterItems.map((item) => (
              <div className="cat-row" key={item.name}>
                <div className="cat-name">
                  <b style={{ background: item.color }} />
                  {item.name}
                </div>
                <div className="cat-val num">
                  {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                </div>
                <div className="track">
                  <i style={{ width: `${Math.min(100, item.percentage)}%`, background: item.color }} />
                </div>
                <div className="cat-meta">
                  <span>{item.percentage}% do limite</span>
                  <span style={item.percentage >= 80 ? { color: item.color } : {}}>
                    {item.percentage >= 80 ? 'Perto do limite · ' : 'Limite '}
                    {formatCurrency(item.limit)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Últimas Transações */}
      <section className="sec">
        <div className="sec-head">
          <h2>Últimas transações</h2>
          <button type="button" className="link" onClick={() => navigate('/transacoes')}>
            Ver todas
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="card txs" id="mobileTxList">
          {recentList.map((tx) => {
            const isIncome = tx.type === 'income'
            return (
              <button
                type="button"
                className="tx"
                key={tx.id}
                onClick={() => openTransactionSheet({ editing: tx })}
              >
                <div className="ic" style={{ color: tx.category?.colorCode || '#888' }}>
                  <Icon name={tx.category?.icon || 'Tag'} size={16} />
                </div>
                <div>
                  <div className="t">{tx.description}</div>
                  <div className="s">{tx.category?.name || 'Geral'}</div>
                </div>
                <div>
                  <div className={`a ${isIncome ? 'pos' : ''}`}>
                    {isIncome ? '+' : '−'}R$ {Number(tx.value).toFixed(2).replace('.', ',')}
                  </div>
                  <div className="d">{tx.transactionDate ? formatDayLabel(tx.transactionDate) : 'Hoje'}</div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        className="btn primary"
        style={{ width: '100%', height: 42, marginTop: 8 }}
        onClick={() => openTransactionSheet()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6 }}>
          <path d="M12 5v14M5 12h14" />
        </svg>
        Registrar novo lançamento
      </button>
    </div>
  )
}

function DesktopDashboard() {
  const navigate = useNavigate()
  const { openTransactionSheet } = useUi()
  const { overview, week, recent, meters } = useDashboardData()
  const today = useToday()
  const [hoveredDay, setHoveredDay] = useState(null)

  if (overview.error) return <ErrorState message={overview.error.message} onRetry={overview.refetch} />

  const recentList = recent.data || []
  const negativeBalance = (overview.data?.balance ?? 0) < 0
  const weekDays = (week.data?.days || []).map((d) => ({
    label: (d.weekday || '').toUpperCase(),
    rawLabel: d.weekday,
    pct: d.percentage || 0,
    value: d.value || 0,
  }))
  const weekdayNames = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

  const meterItems = (meters.data || []).map((m) => ({
    name: m.name,
    spent: m.spent,
    limit: m.limit,
    percentage: m.percentage,
    color: m.colorCode || '#0084ff',
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 3 KPI Cards */}
      <div className="stat-grid">
        {/* Saldo do Mês */}
        <div className="card stat-card">
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="stat-icon saldo" style={{
                width: 22, height: 22, borderRadius: 'var(--ds-radius-md)', background: 'var(--ds-blue-alpha-200)', color: 'var(--ds-blue-600)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </i>
              <span className="stat-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Saldo do Mês</span>
            </div>
            <span className={`badge ${negativeBalance ? 'badge-danger' : ''}`}>
              <span className="badge-dot" style={{ background: negativeBalance ? 'var(--ds-red-700)' : 'var(--ds-green-700)' }} />
              {overview.data?.incomeChangePct != null
                ? `${formatPercent(overview.data.incomeChangePct, { signed: true, decimals: 1 })} mês`
                : 'Sem histórico'}
            </span>
          </div>
          <p className="stat-value num" style={negativeBalance ? { color: 'var(--ds-red-700)' } : undefined}>
            <MoneyText value={overview.data?.balance} signed />
          </p>
          <p className="stat-foot">Disponível restante no mês</p>
        </div>

        {/* Entradas */}
        <div className="card stat-card in">
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="stat-icon in" style={{
                width: 22, height: 22, borderRadius: 'var(--ds-radius-md)', background: 'var(--ds-green-alpha-200)', color: 'var(--ds-green-700)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M8 7h9v9" />
                </svg>
              </i>
              <span className="stat-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Entradas</span>
            </div>
            <span className="badge badge-success">
              <span className="badge-dot" style={{ background: 'var(--ds-green-700)' }} />
              {overview.data?.incomeChangePct != null
                ? `${formatPercent(overview.data.incomeChangePct, { signed: true, decimals: 1 })} mês`
                : 'Sem histórico'}
            </span>
          </div>
          <p className="stat-value num">
            <MoneyText value={overview.data?.income} />
          </p>
          <p className="stat-foot">Receitas consolidadas do mês</p>
        </div>

        {/* Saídas */}
        <div className="card stat-card out">
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="stat-icon out" style={{
                width: 22, height: 22, borderRadius: 'var(--ds-radius-md)', background: 'var(--ds-red-alpha-200)', color: 'var(--ds-red-700)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 7L7 17M16 17H7V8" />
                </svg>
              </i>
              <span className="stat-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Saídas</span>
            </div>
            <span className="badge">
              <span className="badge-dot" style={{ background: 'var(--ds-red-700, #ef4444)' }} />
              {overview.data?.expenseToCeilingPercentage != null
                ? `${formatPercent(overview.data.expenseToCeilingPercentage)} do teto`
                : 'Sem teto'}
            </span>
          </div>
          <p className="stat-value num">
            <MoneyText value={overview.data?.expense} />
          </p>
          <p className="stat-foot">
            {overview.data?.expenseToCeilingPercentage != null && overview.data?.expense
              ? `Limite de ${formatCurrency((overview.data.expense * 100) / overview.data.expenseToCeilingPercentage)}`
              : 'Nenhum teto configurado'}
          </p>
        </div>
      </div>

      {/* Grid 2: Gráfico da Semana & Orçamento por Categoria */}
      <div className="grid-2">
        {/* Distribuição de Gastos da Semana */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p className="card-title">Distribuição de Gastos da Semana</p>
              <span className="stat-foot">
                Média diária de {formatCurrency(week.data?.dailyAverage ?? 0)}
              </span>
            </div>
            <span className="num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-foreground)' }}>
              Total: {formatCurrency(week.data?.total ?? 0)}
            </span>
          </div>

          <div className="spend-chart-container" id="spendChart">
            {(weekDays.length > 0 ? weekDays : weekdayNames.map((w, index) => ({
              label: w,
              rawLabel: WEEKDAY_KEYS[index],
              pct: 0,
              value: 0,
            }))).map((day) => {
              const isToday = isSameWeekday(day.rawLabel, today)
              const isHovered = hoveredDay === day.label
              return (
                <div
                  key={day.label}
                  className={`spend-col ${isToday ? 'active' : ''}`}
                  data-today={isToday || undefined}
                  aria-label={`${isToday ? 'Hoje, ' : ''}${day.label}: ${formatCurrency(day.value)}`}
                  onMouseEnter={() => setHoveredDay(day.label)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{ position: 'relative' }}
                >
                  {isHovered ? (
                    <div className="chart-bar-tooltip" role="tooltip">
                      {isToday ? <span className="chart-bar-tooltip-tag">Hoje</span> : null}
                      {formatCurrency(day.value)}
                    </div>
                  ) : null}
                  <div className="spend-bar-track">
                    <div className="spend-bar-fill" style={{ height: `${day.pct > 0 ? Math.max(8, day.pct) : 0}%` }} />
                  </div>
                  <span className="spend-day">{isToday ? 'HOJE' : day.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Orçamento por Categoria */}
        <div className="card">
          <div className="card-head" style={{ marginBottom: 16 }}>
            <div>
              <p className="card-title">Orçamento por Categoria</p>
              <span className="stat-foot">Acompanhamento de consumo</span>
            </div>
          </div>

          <div className="cat-meter-list">
            {meterItems.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ds-foreground-muted)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span>Nenhum orçamento configurado</span>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: 12.5, height: 32, padding: '0 12px' }}
                  onClick={() => navigate('/categorias')}
                >
                  <Plus size={14} style={{ marginRight: 6 }} />
                  Adicionar categoria
                </button>
              </div>
            ) : (
              meterItems.map((item) => (
                <div className="cat-meter-item" key={item.name}>
                  <div className="cat-meter-head">
                    <span className="cat-meter-label">
                      <span className="cat-meter-dot" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="cat-meter-val num">
                      {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                    </span>
                  </div>
                  <div className="cat-track">
                    <div className="cat-fill" style={{ width: `${Math.min(100, item.percentage)}%`, background: item.color }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lançamentos recentes (Tabela Desktop Oficial) */}
      <div className="card" style={{ marginTop: 4 }}>
        <div className="card-head" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="card-title" style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>Lançamentos recentes</p>
          <button
            type="button"
            className="cat-card-link"
            style={{ fontSize: 12.5, color: 'var(--ds-foreground-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/transacoes')}
          >
            ver tudo
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ fontSize: 11, fontWeight: 500, color: 'var(--ds-foreground-muted)', textTransform: 'none', letterSpacing: 'normal' }}>
                  Descrição
                </th>
                <th style={{ fontSize: 11, fontWeight: 500, color: 'var(--ds-foreground-muted)', textTransform: 'none', letterSpacing: 'normal' }}>
                  Categoria
                </th>
                <th style={{ fontSize: 11, fontWeight: 500, color: 'var(--ds-foreground-muted)', textTransform: 'none', letterSpacing: 'normal' }}>
                  Data
                </th>
                <th style={{ fontSize: 11, fontWeight: 500, color: 'var(--ds-foreground-muted)', textAlign: 'right', textTransform: 'none', letterSpacing: 'normal' }}>
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {recentList.map((item) => {
                const isIncome = item.type === 'income'
                const amountColor = isIncome ? 'var(--ds-green-700)' : 'var(--ds-red-700)'
                const dateStr = item.transactionDate ? formatDayLabel(item.transactionDate) : 'Hoje'
                return (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => openTransactionSheet({ editing: item })}>
                    <td>
                      <div className="tx-cell" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="tx-icon" style={{
                          width: 28, height: 28, borderRadius: 'var(--ds-radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: `${item.category?.colorCode || '#888'}22`, color: item.category?.colorCode || '#888'
                        }}>
                          <Icon name={item.category?.icon || 'Tag'} size={14} />
                        </span>
                        <span style={{ fontWeight: 500 }}>{item.description}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge">
                        <span className="badge-dot" style={{ background: item.category?.colorCode || '#888' }} />
                        {item.category?.name}
                      </span>
                    </td>
                    <td className="num" style={{ color: 'var(--ds-foreground)', fontWeight: 500 }}>{dateStr}</td>
                    <td className="amount-cell num" style={{ color: amountColor, textAlign: 'right', fontWeight: 600 }}>
                      {isIncome ? '+R$ ' : '−R$ '}{Number(item.value).toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function WeekChart({ week, isMobile }) {
  const [activeDay, setActiveDay] = useState(null)
  const days = useMemo(() => {
    const raw = week.data?.days || []
    if (raw.length > 0) {
      return raw.map((day) => ({
        label: day.weekday,
        value: day.value,
        pct: day.percentage,
      }))
    }
    return [
      { label: 'seg', pct: 0, value: 0 },
      { label: 'ter', pct: 0, value: 0 },
      { label: 'qua', pct: 0, value: 0 },
      { label: 'qui', pct: 0, value: 0 },
      { label: 'sex', pct: 0, value: 0 },
      { label: 'sab', pct: 0, value: 0 },
      { label: 'dom', pct: 0, value: 0 },
    ]
  }, [week.data])

  const sumDays = days.reduce((sum, day) => sum + (day.value || 0), 0)
  const total = sumDays > 0 ? sumDays : (week.data?.total ?? 0)
  const dailyAverage = week.data?.dailyAverage ?? (days.length && total > 0 ? total / days.length : 0)
  const today = useToday()

  if (isMobile) {
    return (
      <section className="sec">
        <div className="card">
          <div className="chart-foot">
            <div>
              <div className="sub">Distribuição de Gastos da Semana</div>
              <div className="big" id="dashWeekTotalMobile">{formatCurrency(total)}</div>
            </div>
            <span className="sub" style={{ fontSize: 12, margin: 0 }}>
              Média {formatCurrency(dailyAverage)}/dia
            </span>
          </div>
          <div className="chart" role="img" aria-label={`Distribuição de Gastos da Semana: Total ${formatCurrency(total)}`}>
            {days.map((day) => {
              const isNow = isSameWeekday(day.label, today)
              const isActive = activeDay === day.label?.toLowerCase()
              return (
                <div
                  key={day.label}
                  className={`bar ${isNow ? 'now' : ''} ${isActive ? 'active' : ''}`}
                  data-today={isNow || undefined}
                  aria-label={`${isNow ? 'Hoje, ' : ''}${day.label}: ${formatCurrency(day.value)}`}
                  onClick={() => setActiveDay((prev) => (prev === day.label?.toLowerCase() ? null : day.label?.toLowerCase()))}
                  onMouseEnter={() => setActiveDay(day.label?.toLowerCase())}
                  onMouseLeave={() => setActiveDay(null)}
                  style={{ position: 'relative', cursor: 'pointer' }}
                >
                  {isActive && (
                    <div className="chart-bar-tooltip" role="tooltip">
                      {isNow ? <span className="chart-bar-tooltip-tag">Hoje</span> : null}
                      {formatCurrency(day.value)}
                    </div>
                  )}
                  <span style={{ height: `${day.pct > 0 ? Math.max(6, day.pct) : 0}%` }} />
                  <em>{isNow ? 'hoje' : day.label}</em>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div className="stat-value num" style={{ fontSize: 20 }}>{formatCurrency(total)}</div>
          <div className="stat-foot">
            Total da semana · média {formatCurrency(dailyAverage)}/dia
          </div>
        </div>
      </div>
      <div className="week-bars" role="img" aria-label="Gráfico de gastos da semana">
        {days.map((day) => {
          const isNow = isSameWeekday(day.label, today)
          const isActive = activeDay === day.label.toLowerCase()
          return (
            <div
              key={day.label}
              className={`week-bar-col ${isNow ? 'now' : ''} ${isActive ? 'active' : ''}`}
              onMouseEnter={() => setActiveDay(day.label.toLowerCase())}
              onMouseLeave={() => setActiveDay(null)}
              onClick={() => setActiveDay((prev) => (prev === day.label.toLowerCase() ? null : day.label.toLowerCase()))}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              {isActive && (
                <div className="chart-bar-tooltip" role="tooltip">
                  {isNow ? <span className="chart-bar-tooltip-tag">Hoje</span> : null}
                  {formatCurrency(day.value)}
                </div>
              )}
              <div className="week-bar" style={{ height: `${day.pct > 0 ? Math.max(4, day.pct) : 0}%` }} title={formatCurrency(day.value)} />
              <span className="week-day-label">{day.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BudgetMeters({ meters }) {
  if (meters.loading) return <SkeletonRows rows={3} />
  const items = meters.data || []
  if (items.length === 0) {
    return (
      <p className="text-faint" style={{ fontSize: 12.5 }}>
        Defina tetos em Categorias para acompanhar seu orçamento aqui.
      </p>
    )
  }
  return (
    <div className="cat-meter-list">
      {items.map((item) => (
        <div className="cat-meter-item" key={item.categoryId}>
          <div className="cat-meter-top">
            <b>{item.name}</b>
            <span className="num">
              {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
            </span>
          </div>
          <div className="meter-track">
            <div
              className={`meter-fill ${item.percentage > 100 ? 'over' : item.percentage >= 80 ? 'warn' : ''}`}
              style={{ width: `${Math.min(100, item.percentage)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentList({ items }) {
  const { openTransactionSheet } = useUi()
  if (!items || items.length === 0) {
    return (
      <p className="text-faint" style={{ fontSize: 12.5 }}>
        Nenhum lançamento ainda. Registre o primeiro!
      </p>
    )
  }
  return (
    <div>
      {items.map((item) => (
        <TransactionRow key={item.id} transaction={item} onClick={() => openTransactionSheet({ editing: item })} />
      ))}
    </div>
  )
}

export default DashboardScreen
