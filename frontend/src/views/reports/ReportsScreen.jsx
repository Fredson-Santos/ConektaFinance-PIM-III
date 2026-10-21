import { useMemo, useState } from 'react'
import { FileDown, FileJson, FileText, Sparkles } from 'lucide-react'
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

      <SixMonthsEvolutionChart trend={trend} />

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

function SixMonthsEvolutionChart({ trend }) {
  const items = trend.data || []
  if (trend.loading) return <SkeletonCard height={280} />
  if (items.length === 0) {
    return <EmptyState title="Sem dados no período" description="Registre lançamentos para gerar a evolução." />
  }

  const avgIncome = Math.round(items.reduce((s, i) => s + (i.income || 0), 0) / items.length)
  const avgExpense = Math.round(items.reduce((s, i) => s + (i.expense || 0), 0) / items.length)
  const avgSaved = Math.round(items.reduce((s, i) => s + (i.saved || 0), 0) / items.length)

  const allValues = items.flatMap((i) => [i.income || 0, i.expense || 0, Math.max(0, i.saved || 0)])
  const rawMax = Math.max(...allValues, 1000)
  const maxVal = Math.ceil(rawMax / 1000) * 1000

  const steps = [
    { y: 30, val: maxVal },
    { y: 80, val: Math.round(maxVal * 0.85) },
    { y: 130, val: Math.round(maxVal * 0.65) },
    { y: 180, val: Math.round(maxVal * 0.45) },
    { y: 230, val: Math.round(maxVal * 0.15) },
  ]

  const getY = (val) => {
    const clamped = Math.max(0, Math.min(val, maxVal))
    return 230 - (clamped / maxVal) * 200
  }

  const count = items.length
  const getX = (idx) => {
    if (count <= 1) return 400
    return 130 + (idx / (count - 1)) * 630
  }

  const incomePoints = items.map((item, idx) => ({ x: getX(idx), y: getY(item.income || 0) }))
  const expensePoints = items.map((item, idx) => ({ x: getX(idx), y: getY(item.expense || 0) }))
  const savedPoints = items.map((item, idx) => ({ x: getX(idx), y: getY(Math.max(0, item.saved || 0)) }))

  const incomePath = `M ${incomePoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
  const expensePath = `M ${expensePoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
  const savedPath = `M ${savedPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`

  const firstX = getX(0)
  const lastX = getX(count - 1)
  const incomeArea = `${incomePath} L ${lastX},230 L ${firstX},230 Z`
  const expenseArea = `${expensePath} L ${lastX},230 L ${firstX},230 Z`
  const savedArea = `${savedPath} L ${lastX},230 L ${firstX},230 Z`

  return (
    <div className="card" style={{ marginBottom: 20 }} aria-label="Evolução de 6 meses">
      <div className="card-head">
        <div>
          <p className="card-title">Evolução dos Últimos 6 Meses</p>
          <span className="stat-foot">Comparativo mensal entre Receitas, Despesas e Saldo Líquido Guardado</span>
        </div>
        <div className="chart-6m-legend">
          <span className="chart-6m-legend-item">
            <span className="badge-dot" style={{ background: 'var(--ds-green-700)' }} />
            Receitas (Méd. {formatCurrency(avgIncome)})
          </span>
          <span className="chart-6m-legend-item">
            <span className="badge-dot" style={{ background: 'var(--ds-blue-600)' }} />
            Despesas (Méd. {formatCurrency(avgExpense)})
          </span>
          <span className="chart-6m-legend-item">
            <span className="badge-dot" style={{ background: 'var(--ds-gray-500)' }} />
            Reserva Líquida (Méd. {formatCurrency(avgSaved)})
          </span>
        </div>
      </div>

      <div className="chart-6m-line-wrap">
        <svg className="chart-6m-svg" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet">
          {steps.map((s, i) => (
            <line key={i} className="chart-6m-grid-line" x1={60} y1={s.y} x2={760} y2={s.y} />
          ))}

          {steps.map((s, i) => (
            <text key={i} className="chart-6m-val-label" x={54} y={s.y + 4} textAnchor="end">
              {formatCompact(s.val).replace('R$', '').trim()}
            </text>
          ))}

          <defs>
            <linearGradient id="areaGradReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ds-green-700)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--ds-green-700)" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="areaGradDespesa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ds-blue-600)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--ds-blue-600)" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="areaGradReserva" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ds-gray-500)" stopOpacity="0.10" />
              <stop offset="100%" stopColor="var(--ds-gray-500)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <path className="chart-6m-area receita" d={incomeArea} fill="url(#areaGradReceita)" />
          <path className="chart-6m-area despesa" d={expenseArea} fill="url(#areaGradDespesa)" />
          <path className="chart-6m-area reserva" d={savedArea} fill="url(#areaGradReserva)" />

          <path className="chart-6m-path receita" d={incomePath} />
          <path className="chart-6m-path despesa" d={expensePath} />
          <path className="chart-6m-path reserva" d={savedPath} />

          {items.map((item, idx) => {
            const x = getX(idx)
            const isLast = idx === count - 1
            const label = item.period?.slice(0, 7) || ''
            return (
              <text
                key={idx}
                className={`chart-6m-axis-label ${isLast ? 'active-month' : ''}`}
                x={x}
                y={254}
                textAnchor="middle"
              >
                {label}
              </text>
            )
          })}

          {items.map((item, idx) => {
            const x = getX(idx)
            const yInc = getY(item.income || 0)
            const yExp = getY(item.expense || 0)
            const ySav = getY(Math.max(0, item.saved || 0))
            const tooltipX = idx > count - 2 ? x - 170 : Math.max(60, x - 50)
            return (
              <g className="chart-6m-group-g" key={idx}>
                <rect className="chart-6m-hover-zone" x={x - 48} y={20} width={96} height={240} />
                <line className="chart-6m-hover-line" x1={x} y1={30} x2={x} y2={230} />
                <circle className="chart-6m-dot receita" cx={x} cy={yInc} r={4} />
                <circle className="chart-6m-dot despesa" cx={x} cy={yExp} r={4} />
                <circle className="chart-6m-dot reserva" cx={x} cy={ySav} r={4} />
                <g className="chart-6m-tooltip-g" transform={`translate(${tooltipX}, 0)`}>
                  <rect className="chart-6m-tooltip-bg" x={0} y={0} width={160} height={80} rx={8} />
                  <text className="chart-6m-tooltip-text bold" x={12} y={18} fontSize={11}>{item.period}</text>
                  <text className="chart-6m-tooltip-text muted" x={12} y={34}>Receitas:</text>
                  <text className="chart-6m-tooltip-text bold" x={148} y={34} textAnchor="end" fill="var(--ds-green-700)">
                    {formatCurrency(item.income || 0)}
                  </text>
                  <text className="chart-6m-tooltip-text muted" x={12} y={50}>Despesas:</text>
                  <text className="chart-6m-tooltip-text bold" x={148} y={50} textAnchor="end" fill="var(--ds-blue-600)">
                    {formatCurrency(item.expense || 0)}
                  </text>
                  <text className="chart-6m-tooltip-text muted" x={12} y={66}>Guardado:</text>
                  <text className="chart-6m-tooltip-text bold" x={148} y={66} textAnchor="end">
                    {formatCurrency(item.saved || 0)}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
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
