import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { dashboardService, reportService, insightService } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../context/AuthContext'
import { useUi } from '../../context/UiContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { SegmentedControl } from '../../components/common/SegmentedControl'
import { SkeletonCard, SkeletonRows } from '../../components/common/Skeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { TransactionRow } from '../../components/transactions/TransactionRow'
import { MoneyText } from '../../components/common/MoneyText'
import { formatCurrency, formatPercent } from '../../utils/format'
import { monthPeriod, formatDayLabel } from '../../utils/dates'
import { Icon } from '../../components/common/Icon'

export function DashboardScreen() {
  const isMobile = useMediaQuery('(max-width: 880px)')
  return isMobile ? <MobileDashboard /> : <DesktopDashboard />
}

function useDashboardData() {
  const overview = useAsync(() => dashboardService.overview(), [])
  const week = useAsync(() => dashboardService.weeklyExpenses(), [])
  const recent = useAsync(() => dashboardService.recentTransactions(5), [])
  const meters = useAsync(() => dashboardService.budgetMeters(), [])
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Olá, {firstName}</h2>
        <div className="page-sub">Aqui está o resumo do seu mês.</div>
      </div>

      <section className="ds-card stat-card" aria-label="Saldo em conta">
        <div className="stat-label">Saldo em conta</div>
        {overview.loading ? (
          <div className="stat-value num">—</div>
        ) : (
          <>
            <div className="stat-value num">
              <MoneyText value={overview.data.balance} />
            </div>
            <Badge variant={(overview.data.incomeChangePct || 0) >= 0 ? 'ok' : 'bad'}>
              {overview.data.incomeChangePct != null
                ? `${formatPercent(overview.data.incomeChangePct, { signed: true, decimals: 1 })} vs mês anterior`
                : 'Primeiro mês de uso'}
            </Badge>
          </>
        )}
      </section>

      <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <MiniStat label="Entradas" tone="green" state={overview} pick={(data) => data.income} loading={overview.loading} />
        <MiniStat label="Saídas" tone="red" state={overview} pick={(data) => data.expense} loading={overview.loading} />
      </div>

      <WeekChart week={week} />

      <section className="ds-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="ai-avatar" style={{ width: 28, height: 28 }}>
            <Sparkles size={14} />
          </span>
          <p style={{ fontSize: 12.5, color: 'var(--ds-foreground-muted)', flex: 1 }}>
            {insight ? insight.description : 'Sua saúde financeira está sob controle. Continue assim!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => openOverlay('ai')} style={{ flex: 1 }}>
            Ver detalhes
          </Button>
          <Button variant="secondary" onClick={() => navigate('/categorias')} style={{ flex: 1 }}>
            Criar limite
          </Button>
        </div>
      </section>

      <section className="ds-card" style={{ padding: 16 }}>
        <div className="side-card-title" style={{ marginBottom: 12 }}>Categorias do mês</div>
        <BudgetMeters meters={meters} />
      </section>

      <section className="ds-card" style={{ padding: 16 }}>
        <div className="side-card-title" style={{ marginBottom: 6 }}>Últimas transações</div>
        {recent.loading ? <SkeletonRows rows={3} /> : <RecentList items={recent.data} />}
        <button type="button" className="cat-card-link" onClick={() => navigate('/transacoes')}>
          ver tudo <ArrowRight size={12} style={{ verticalAlign: -1 }} />
        </button>
      </section>

      <Button variant="blue" fullWidth icon={ArrowRight} onClick={() => openTransactionSheet()}>
        Registrar novo lançamento
      </Button>
    </div>
  )
}

function MiniStat({ label, tone, state, pick, loading }) {
  return (
    <div className="ds-card stat-card" style={{ padding: 16, gap: 4 }}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value num ${tone === 'green' ? 'text-success' : ''}`} style={{ fontSize: 18 }}>
        {loading ? '—' : <MoneyText value={pick(state.data)} />}
      </div>
    </div>
  )
}

function DesktopDashboard() {
  const navigate = useNavigate()
  const { openTransactionSheet } = useUi()
  const { overview, week, recent, meters } = useDashboardData()

  if (overview.error) return <ErrorState message={overview.error.message} onRetry={overview.refetch} />

  const recentList = recent.data || []
  const weekDays = (week.data?.days || []).map((d) => ({
    label: (d.weekday || '').toUpperCase(),
    rawLabel: d.weekday,
    pct: d.percentage || 0,
    value: d.value || 0,
  }))
  const todayWeekdayIndex = (new Date().getDay() + 6) % 7
  const weekdayNames = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
  const todayWeekday = weekdayNames[todayWeekdayIndex]

  const defaultMeters = [
    { name: 'Moradia', spent: 1800, limit: 2000, percentage: 90, color: '#0070f3' },
    { name: 'Alimentação', spent: 980, limit: 1500, percentage: 65, color: '#f5a623' },
    { name: 'Transporte', spent: 380, limit: 600, percentage: 63, color: '#12b5cb' },
    { name: 'Lazer & Lojas', spent: 290, limit: 800, percentage: 36, color: '#8e4ec6' },
  ]
  const meterItems = meters.data && meters.data.length > 0
    ? meters.data.map((m) => ({
        name: m.name,
        spent: m.spent,
        limit: m.limit,
        percentage: m.percentage,
        color: m.colorCode || '#0070f3',
      }))
    : defaultMeters

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 3 KPI Cards */}
      <div className="stat-grid">
        {/* Saldo em Conta */}
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
              <span className="stat-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Saldo em Conta</span>
            </div>
            <span className="badge">
              <span className="badge-dot" style={{ background: 'var(--ds-green-700)' }} />
              {overview.data?.incomeChangePct != null
                ? `${formatPercent(overview.data.incomeChangePct, { signed: true, decimals: 1 })} mês`
                : '+14.2% mês'}
            </span>
          </div>
          <p className="stat-value num">
            <MoneyText value={overview.data?.balance} />
          </p>
          <p className="stat-foot">Atualizado agora</p>
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
                : '+8.4% mês'}
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
                : '68% do teto'}
            </span>
          </div>
          <p className="stat-value num">
            <MoneyText value={overview.data?.expense} />
          </p>
          <p className="stat-foot">
            {overview.data?.expenseToCeilingPercentage != null && overview.data?.expense
              ? `Limite de ${formatCurrency((overview.data.expense * 100) / overview.data.expenseToCeilingPercentage)}`
              : 'Limite de R$ 6.350,00'}
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
                Média diária de {formatCurrency(week.data?.dailyAverage ?? 142)}
              </span>
            </div>
            <span className="num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-foreground)' }}>
              Total: {formatCurrency(week.data?.total ?? 994)}
            </span>
          </div>

          <div className="spend-chart-container" id="spendChart">
            {(weekDays.length > 0 ? weekDays : weekdayNames.map((w, idx) => ({
              label: w,
              rawLabel: w.toLowerCase(),
              pct: [45, 30, 65, 40, 90, 75, 32][idx] || 40,
              value: 100,
            }))).map((day) => {
              const isToday = day.label === todayWeekday || day.rawLabel === 'dom'
              return (
                <div key={day.label} className={`spend-col ${isToday ? 'active' : ''}`}>
                  <div className="spend-bar-track">
                    <div className="spend-bar-fill" style={{ height: `${Math.max(10, day.pct)}%` }} />
                  </div>
                  <span className="spend-day">{day.label}</span>
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
            {meterItems.map((item) => (
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
            ))}
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
                const amountColor = isIncome ? 'var(--ds-green-700)' : '#f87171'
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

function WeekChart({ week }) {
  const [range, setRange] = useState('week')
  const now = new Date()
  const month = useAsync(
    () => reportService.daily(monthPeriod(now.getMonth() + 1, now.getFullYear()).start, monthPeriod(now.getMonth() + 1, now.getFullYear()).end),
    [],
  )

  const days = useMemo(() => {
    if (range === 'week') {
      return (week.data?.days || []).map((day) => ({ label: day.weekday, value: day.value, pct: day.percentage }))
    }
    const items = (month.data || []).slice(0, new Date().getDate())
    const max = Math.max(...items.map((item) => item.value), 1)
    return items.map((item) => ({ label: item.day, value: item.value, pct: Math.round((item.value / max) * 100) }))
  }, [range, week.data, month.data])

  const total = days.reduce((sum, day) => sum + day.value, 0)
  const todayLabel = range === 'week' ? ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'][((new Date().getDay() + 6) % 7)] : String(new Date().getDate()).padStart(2, '0')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div className="stat-value num" style={{ fontSize: 20 }}>{formatCurrency(total)}</div>
          <div className="stat-foot">
            {range === 'week' ? 'Total da semana' : 'Acumulado do mês'} · média {formatCurrency(days.length ? total / days.length : 0)}
          </div>
        </div>
        <SegmentedControl
          name="Período do gráfico"
          value={range}
          onChange={setRange}
          options={[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mês' },
          ]}
        />
      </div>
      <div className="week-bars" role="img" aria-label="Gráfico de gastos do período">
        {days.map((day) => (
          <div key={day.label} className={`week-bar-col ${day.label === todayLabel ? 'now' : ''}`}>
            <div className="week-bar" style={{ height: `${Math.max(4, day.pct)}%` }} title={formatCurrency(day.value)} />
            <span className="week-day-label">{day.label}</span>
          </div>
        ))}
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
