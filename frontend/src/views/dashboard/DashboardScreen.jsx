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
import { monthPeriod } from '../../utils/dates'

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
  const { overview, week, recent, meters } = useDashboardData()

  if (overview.error) return <ErrorState message={overview.error.message} onRetry={overview.refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="stat-grid">
        <section className="ds-card stat-card" aria-label="Saldo em conta">
          <div className="stat-label">Saldo em conta</div>
          <div className="stat-value num">
            <MoneyText value={overview.data?.balance} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge variant={(overview.data?.incomeChangePct || 0) >= 0 ? 'ok' : 'bad'}>
              {overview.data?.incomeChangePct != null
                ? `${formatPercent(overview.data.incomeChangePct, { signed: true, decimals: 1 })} mês`
                : 'Atualizado agora'}
            </Badge>
          </div>
          <div className="stat-foot">Atualizado agora</div>
        </section>
        <section className="ds-card stat-card" aria-label="Entradas do mês">
          <div className="stat-label">Entradas</div>
          <div className="stat-value num text-success">
            <MoneyText value={overview.data?.income} />
          </div>
          <div className="stat-foot">
            {overview.data?.expenseToCeilingPercentage != null
              ? `${formatPercent(overview.data.expenseToCeilingPercentage)} do teto geral`
              : 'Sem teto geral definido'}
          </div>
        </section>
        <section className="ds-card stat-card" aria-label="Saídas do mês">
          <div className="stat-label">Saídas</div>
          <div className="stat-value num">
            <MoneyText value={overview.data?.expense} />
          </div>
          <Badge variant={(overview.data?.expenseChangePct || 0) > 0 ? 'warn' : 'ok'}>
            {overview.data?.expenseChangePct != null
              ? `${formatPercent(overview.data.expenseChangePct, { signed: true, decimals: 1 })} mês`
              : 'Primeiro mês'}
          </Badge>
        </section>
      </div>

      <div className="grid-2">
        <section className="ds-card" aria-label="Gastos da semana">
          <div className="card-head">
            <h3 className="card-title">Distribuição da semana</h3>
          </div>
          <div className="card-body">
            <WeekChart week={week} />
          </div>
        </section>
        <section className="ds-card" aria-label="Orçamento por categoria">
          <div className="card-head">
            <h3 className="card-title">Orçamento por categoria</h3>
          </div>
          <div className="card-body">
            <BudgetMeters meters={meters} />
          </div>
        </section>
      </div>

      <section className="ds-card" aria-label="Lançamentos recentes">
        <div className="card-head" style={{ justifyContent: 'space-between' }}>
          <h3 className="card-title">Lançamentos recentes</h3>
          <button type="button" className="cat-card-link" onClick={() => navigate('/transacoes')}>
            ver tudo →
          </button>
        </div>
        <div className="card-body">
          {recent.loading ? <SkeletonRows rows={4} /> : <RecentList items={recent.data} />}
        </div>
      </section>
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
