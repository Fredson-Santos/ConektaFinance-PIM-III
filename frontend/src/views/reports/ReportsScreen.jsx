import { useMemo, useState } from 'react'
import { FileDown, FileJson, FileText, Sparkles } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { reportService, insightService } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { SegmentedControl } from '../../components/common/SegmentedControl'
import { TrendBadge } from '../../components/common/TrendBadge'
import { SkeletonCard, SkeletonRows } from '../../components/common/Skeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { formatCurrency, formatPercent, formatCompact } from '../../utils/format'
import { monthPeriod, addMonths } from '../../utils/dates'
import { exportMonthlyPdf } from './pdf'

const PERIODS = [
  { value: 'month', label: 'Mês' },
  { value: '6m', label: '6 meses' },
  { value: 'year', label: 'Ano' },
]

function periodRange(period) {
  const now = new Date()
  if (period === '6m') {
    const start = addMonths(now.getMonth() + 1, now.getFullYear(), -5)
    return { start: `${start.year}-${String(start.month).padStart(2, '0')}-01`, end: monthPeriod(now.getMonth() + 1, now.getFullYear()).end }
  }
  if (period === 'year') {
    return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` }
  }
  return monthPeriod(now.getMonth() + 1, now.getFullYear())
}

function periodLabel(period) {
  const now = new Date()
  if (period === '6m') {
    const start = addMonths(now.getMonth() + 1, now.getFullYear(), -5)
    const startLabel = start.month
    return `Últimos 6 meses (${new Date(start.year, start.month - 1).toLocaleDateString('pt-BR', { month: 'short' })} – ${now.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })})`
  }
  if (period === 'year') return `Ano inteiro de ${now.getFullYear()}`
  return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function ReportsScreen() {
  const isMobile = useMediaQuery('(max-width: 880px)')
  const [period, setPeriod] = useState('6m')
  const range = useMemo(() => periodRange(period), [period])
  const label = useMemo(() => periodLabel(period), [period])

  const summary = useAsync(() => reportService.summary(range.start, range.end), [range.start, range.end])
  const byCategory = useAsync(() => reportService.byCategory(range.start, range.end), [range.start, range.end])
  const trend = useAsync(() => reportService.trend(6), [])
  const previousCategories = useAsync(() => {
    const now = new Date()
    const prev = addMonths(now.getMonth() + 1, now.getFullYear(), -1)
    const prevRange = monthPeriod(prev.month, prev.year)
    return reportService.byCategory(prevRange.start, prevRange.end)
  }, [])
  const insights = useAsync(() => insightService.list(), [])

  if (summary.error) return <ErrorState message={summary.error.message} onRetry={summary.refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="gastos-header">
        <div>
          <h2 className="card-title" style={{ fontSize: 17 }}>Relatórios</h2>
          <div className="page-sub">{label}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SegmentedControl name="Período" value={period} onChange={setPeriod} options={PERIODS} />
          <ExportButtons period={period} range={range} summary={summary} byCategory={byCategory} label={label} />
        </div>
      </div>

      {isMobile ? (
        <MobileReports summary={summary} byCategory={byCategory} trend={trend} insights={insights} />
      ) : (
        <DesktopReports summary={summary} byCategory={byCategory} trend={trend} insights={insights} previousCategories={previousCategories} />
      )}
    </div>
  )
}

function ExportButtons({ period, range, summary, byCategory, label }) {
  const toast = useToast()
  if (period !== 'month') return null
  return (
    <>
      <Button
        variant="secondary"
        icon={FileText}
        onClick={() => {
          if (!summary.data || !byCategory.data) {
            toast.push('Aguarde o carregamento do relatório.', 'error')
            return
          }
          exportMonthlyPdf({
            period: { label, key: range.start.slice(0, 7) },
            summary: summary.data,
            byCategory: byCategory.data,
          })
        }}
      >
        Exportar PDF
      </Button>
      <Button
        variant="secondary"
        icon={FileDown}
        onClick={() => reportService.exportCsv(range.start, range.end).catch(() => toast.push('Falha ao exportar CSV.', 'error'))}
      >
        CSV
      </Button>
      <Button
        variant="ghost"
        icon={FileJson}
        aria-label="Exportar JSON"
        onClick={() => reportService.exportJson(range.start, range.end).catch(() => toast.push('Falha ao exportar JSON.', 'error'))}
      />
    </>
  )
}

function KpiCard({ label, value, badge, foot }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value num">{value}</div>
      {badge}
      {foot ? <div className="kpi-foot">{foot}</div> : null}
    </div>
  )
}

function MobileReports({ summary, byCategory, trend, insights }) {
  const savedAverage = useMemo(() => {
    const items = trend.data || []
    if (items.length === 0) return 0
    return items.reduce((sum, item) => sum + item.saved, 0) / items.length
  }, [trend.data])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <KpiCard
        label="Sobra média por mês"
        value={formatCurrency(savedAverage)}
        badge={<Badge variant={savedAverage >= 0 ? 'ok' : 'bad'}>{savedAverage >= 0 ? '+' : ''}{formatCurrency(Math.abs(savedAverage))} por mês</Badge>}
      />

      <section className="card" aria-label="Entradas e saídas por mês">
        <div className="card-head">
          <h3 className="card-title">Entradas e saídas</h3>
        </div>
        <div className="card-body">
          <InOutBars trend={trend} />
        </div>
      </section>

      <section className="card" aria-label="Composição dos gastos">
        <div className="card-head">
          <h3 className="card-title">Para onde foi o dinheiro</h3>
        </div>
        <div className="card-body">
          <Donut byCategory={byCategory} />
        </div>
      </section>

      <section className="card" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="ai-avatar" style={{ width: 28, height: 28 }}>
          <Sparkles size={14} />
        </span>
        <p style={{ fontSize: 12.5, color: 'var(--ds-foreground-muted)' }}>
          {(insights.data || [])[0]?.description || 'Continue registrando lançamentos para receber análises da IA.'}
        </p>
      </section>
    </div>
  )
}

function DesktopReports({ summary, byCategory, trend, insights, previousCategories }) {
  const savingsAccumulated = useMemo(
    () => (trend.data || []).reduce((sum, item) => sum + item.saved, 0),
    [trend.data],
  )
  const averageMonthly = summary.data?.averageMonthlyExpense || 0
  const totalPeriod = summary.data?.totalExpense || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="kpi-grid">
        <KpiCard
          label="Média mensal de gastos"
          value={formatCurrency(averageMonthly || totalPeriod)}
          badge={
            summary.data?.previousPeriod?.expenseChangePct != null ? (
              <TrendBadge value={summary.data.previousPeriod.expenseChangePct} />
            ) : null
          }
          foot={`Total do período: ${formatCurrency(totalPeriod)}`}
        />
        <KpiCard
          label="Economia acumulada (6M)"
          value={formatCurrency(savingsAccumulated)}
          badge={<Badge variant={savingsAccumulated >= 0 ? 'ok' : 'bad'}>{savingsAccumulated >= 0 ? 'Guardado' : 'No vermelho'}</Badge>}
          foot={`Média de ${formatCurrency(trend.data?.length ? savingsAccumulated / trend.data.length : 0)} por mês`}
        />
        <KpiCard
          label="Diagnóstico da IA"
          value={`${(insights.data || []).length} insights`}
          badge={<Badge variant="blue">Gerados agora</Badge>}
          foot="Sugestões recalculadas com seus dados"
        />
      </div>

      <section className="card" aria-label="Evolução de 6 meses">
        <div className="card-head">
          <h3 className="card-title">Evolução dos últimos 6 meses</h3>
        </div>
        <div className="card-body">
          {trend.loading ? (
            <SkeletonCard height={220} />
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={trend.data || []} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="var(--ds-grid-line)" vertical={false} />
                  <XAxis dataKey="period" stroke="var(--ds-foreground-faint)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--ds-foreground-faint)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => formatCompact(value).replace('R$ ', '')} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ background: 'var(--ds-background-100)', border: '1px solid var(--ds-border-strong)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="income" name="Receitas" stroke="var(--ds-green-700)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" name="Despesas" stroke="var(--ds-red-700)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="saved" name="Guardado" stroke="var(--ds-blue-700)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <div className="grid-2">
        <section className="card" aria-label="Composição dos gastos">
          <div className="card-head">
            <h3 className="card-title">Composição dos gastos</h3>
          </div>
          <div className="card-body">
            <Donut byCategory={byCategory} />
          </div>
        </section>

        <section className="card" aria-label="Insights da IA">
          <div className="card-head">
            <h3 className="card-title">Diagnóstico & insights da IA</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.loading ? (
              <SkeletonRows rows={3} />
            ) : (insights.data || []).length === 0 ? (
              <p className="text-faint" style={{ fontSize: 12.5 }}>
                Registre mais lançamentos para a IA gerar análises personalizadas.
              </p>
            ) : (
              insights.data.map((insight, index) => (
                <div key={index} style={{ display: 'flex', gap: 10 }}>
                  <Badge variant={insight.severity === 'critical' ? 'bad' : insight.severity === 'warning' ? 'warn' : 'blue'}>
                    {insight.severity === 'critical' ? 'Crítico' : insight.severity === 'warning' ? 'Atenção' : 'Info'}
                  </Badge>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: 13 }}>{insight.title}</b>
                    <p style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>{insight.description}</p>
                    <p style={{ fontSize: 12, color: 'var(--ds-green-700)' }}>{insight.suggestion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <CategoryTable byCategory={byCategory} previousCategories={previousCategories} />
    </div>
  )
}

function InOutBars({ trend }) {
  const items = trend.data || []
  const max = Math.max(...items.flatMap((item) => [item.income, item.expense]), 1)
  return (
    <div className="pairs">
      {items.map((item) => (
        <div className="pair" key={item.period}>
          <div className="pair-bars">
            <span className="in" style={{ height: `${Math.max(3, (item.income / max) * 100)}%` }} title={`Entradas: ${formatCurrency(item.income)}`} />
            <span className="out" style={{ height: `${Math.max(3, (item.expense / max) * 100)}%` }} title={`Saídas: ${formatCurrency(item.expense)}`} />
          </div>
          <span className="pair-label">{item.period.slice(0, 2)}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ byCategory }) {
  const items = (byCategory.data || []).filter((item) => item.total > 0)
  if (byCategory.loading) return <SkeletonCard height={140} />
  if (items.length === 0) {
    return <EmptyState title="Sem gastos no período" description="Registre lançamentos para ver a composição." />
  }
  const total = items.reduce((sum, item) => sum + item.total, 0)
  let accumulated = 0
  const gradient = items
    .map((item) => {
      const start = (accumulated / total) * 360
      accumulated += item.total
      const end = (accumulated / total) * 360
      return `${item.colorCode} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div className="donut-row">
      <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="donut-center">
          <b>{formatCompact(total)}</b>
          <span>no período</span>
        </div>
      </div>
      <div className="donut-legend">
        {items.map((item) => (
          <div className="dl-item" key={item.categoryId}>
            <i style={{ background: item.colorCode }} />
            <span>{item.name}</span>
            <b className="num">{formatPercent(item.percentage, { decimals: 1 })}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryTable({ byCategory, previousCategories }) {
  const previous = useMemo(() => {
    const map = new Map()
    for (const item of previousCategories.data || []) map.set(item.categoryId, item.total)
    return map
  }, [previousCategories.data])

  if (byCategory.loading) return <SkeletonRows rows={5} />
  const items = byCategory.data || []
  if (items.length === 0) {
    return <EmptyState title="Nenhum gasto no período" description="Os dados aparecem aqui assim que você registrar lançamentos." />
  }
  const max = Math.max(...items.map((item) => item.total), 1)

  return (
    <section className="card" aria-label="Desempenho por categoria">
      <div className="card-head">
        <h3 className="card-title">Desempenho por categoria</h3>
      </div>
      <div className="card-body table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Total</th>
              <th>Participação</th>
              <th style={{ width: 140 }}>Volume</th>
              <th>vs mês anterior</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const previousTotal = previous.get(item.categoryId) || 0
              const change = previousTotal === 0 ? null : ((item.total - previousTotal) / previousTotal) * 100
              return (
                <tr key={item.categoryId}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <i style={{ width: 10, height: 10, borderRadius: 3, background: item.colorCode }} />
                      {item.name}
                    </span>
                  </td>
                  <td className="num">{formatCurrency(item.total)}</td>
                  <td className="num">{formatPercent(item.percentage, { decimals: 1 })}</td>
                  <td>
                    <div className="meter-track" style={{ height: 6 }}>
                      <div className="meter-fill" style={{ width: `${(item.total / max) * 100}%` }} />
                    </div>
                  </td>
                  <td>{change == null ? <span className="text-faint" style={{ fontSize: 12 }}>sem base</span> : <TrendBadge value={change} />}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ReportsScreen
