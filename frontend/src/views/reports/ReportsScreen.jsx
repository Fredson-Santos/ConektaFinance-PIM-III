import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
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
import { InOutChart } from '../../components/charts/InOutChart'

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
  const toast = useToast()

  if (summary.error) return <ErrorState message={summary.error.message} onRetry={summary.refetch} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {isMobile ? (
        <div className="gastos-header">
          <div>
            <h2 className="card-title" style={{ fontSize: 17 }}>Relatórios</h2>
            <div className="page-sub">{label}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ExportButtons period={period} range={range} summary={summary} byCategory={byCategory} label={label} />
          </div>
        </div>
      ) : (
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <SegmentedControl name="Período" value={period} onChange={setPeriod} options={PERIODS} />
            <div className="select-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--ds-background-100)', border: '1px solid var(--ds-border)', borderRadius: 'var(--ds-radius-md)', padding: '6px 12px', fontSize: 13, color: 'var(--ds-foreground)', cursor: 'pointer' }}>
              Consolidado (Todas as contas)
              <svg className="icon" style={{ width: 12, height: 12 }}><use href="#i-chevron-down" /></svg>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ExportButtons period={period} range={range} summary={summary} byCategory={byCategory} label={label} />
          </div>
        </div>
      )}

      {isMobile ? (
        <MobileReports
          summary={summary}
          byCategory={byCategory}
          trend={trend}
          insights={insights}
          period={period}
          setPeriod={setPeriod}
          range={range}
          label={label}
        />
      ) : (
        <DesktopReports summary={summary} byCategory={byCategory} trend={trend} insights={insights} previousCategories={previousCategories} />
      )}
    </div>
  )
}

function ExportButtons({ range, summary, byCategory, label }) {
  const toast = useToast()
  return (
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
      Exportar
    </Button>
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

function MobileReports({ summary, byCategory, trend, insights, period, setPeriod, range, label }) {
  const toast = useToast()
  const savedAverage = useMemo(() => {
    const items = trend.data || []
    if (items.length === 0) return 0
    return items.reduce((sum, item) => sum + item.saved, 0) / items.length
  }, [trend.data])


  const donutColors = ['#0070f3', '#f5a623', '#8e4ec6', '#e93d82', '#00cc88', '#666666']
  const activeCategories = useMemo(() => {
    const raw = (byCategory.data || []).filter((cat) => (cat.total || 0) > 0)
    const total = raw.reduce((sum, cat) => sum + cat.total, 0)
    return raw.map((cat, idx) => ({
      ...cat,
      colorCode: cat.colorCode || donutColors[idx % donutColors.length],
      calcPct: total > 0 ? (cat.total / total) * 100 : (cat.percentage || 0),
    }))
  }, [byCategory.data])

  const mobileDonutGradient = useMemo(() => {
    if (activeCategories.length === 0) return null
    let acc = 0
    const stops = activeCategories.map((cat) => {
      const start = acc
      acc += cat.calcPct
      const end = Math.min(100, acc)
      return `${cat.colorCode} ${start.toFixed(1)}% ${end.toFixed(1)}%`
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [activeCategories])

  const categoryList = byCategory.data || []
  const insight = (insights.data || [])[0]

  return (
    <div className="mobile-rel-content">
      <div className="seg" style={{ marginTop: 4 }} id="periodMobile" role="radiogroup" aria-label="Período">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={period === p.value}
            className={period === p.value ? 'on' : ''}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 4 KPIs Mobile */}
      <div className="report-grid-kpi" style={{ marginTop: 8, marginBottom: 14 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)' }}>Balanço líquido</span>
            <span className={`badge ${(summary.data?.balance || 0) >= 0 ? 'b-ok' : 'b-bad'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
              {(summary.data?.balance || 0) >= 0 ? 'Azul' : 'Vermelho'}
            </span>
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 700, color: (summary.data?.balance || 0) >= 0 ? 'var(--ds-green-500, #00cc88)' : 'var(--ds-red-500)' }}>
            {(summary.data?.balance || 0) >= 0 ? '+ ' : ''}{formatCurrency(summary.data?.balance || 0)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', marginTop: 2 }}>
            In {formatCompact(summary.data?.totalIncome || 0)} • Out {formatCompact(summary.data?.totalExpense || 0)}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)' }}>Taxa poupança</span>
            <span className="badge" style={{ fontSize: 10, padding: '2px 6px' }}>
              Meta 20%
            </span>
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 700 }}>
            {summary.data?.savingsRate != null ? formatPercent(summary.data.savingsRate, { decimals: 0 }) : '0%'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', marginTop: 2 }}>
            {formatCompact(Math.max(0, summary.data?.balance || 0))} guardados
          </div>
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)' }}>Custos fixos</span>
            <span className="badge" style={{ fontSize: 10, padding: '2px 6px' }}>
              {summary.data?.totalExpense && summary.data?.recurrentSpent
                ? `${Math.round((summary.data.recurrentSpent / summary.data.totalExpense) * 100)}%`
                : 'Fixos'}
            </span>
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 700 }}>
            {formatCurrency(summary.data?.recurrentSpent || 0)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', marginTop: 2 }}>
            {summary.data?.recurrentCount || 0} contas fixas
          </div>
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)' }}>Maior gasto</span>
            <span className="badge" style={{ fontSize: 10, padding: '2px 6px', color: 'var(--ds-amber-600)' }}>
              Pico
            </span>
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ds-amber-600)' }}>
            {summary.data?.largestExpense ? formatCurrency(summary.data.largestExpense.amount) : 'R$ 0'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {summary.data?.largestExpense?.description || 'Nenhum'}
          </div>
        </div>
      </div>

      {/* Entradas e saídas */}
      <section className="sec">
        <h2>Entradas e saídas</h2>
        <div className="card">
          <InOutChart items={trend.data || []} />
        </div>
      </section>

      {/* Para onde foi o dinheiro */}
      <section className="sec">
        <h2>Para onde foi o dinheiro</h2>
        <div className="card donut-row">
          <div className="donut" style={mobileDonutGradient ? { background: mobileDonutGradient } : undefined}>
            <div className="donut-center">
              <span className="big">{formatCurrency(summary.data?.totalExpense || 0)}</span>
              <span className="sub">Total saídas</span>
            </div>
          </div>
          <div className="dl">
            {activeCategories.slice(0, 4).map((cat) => (
              <div key={cat.categoryId || cat.name}>
                <span>
                  <i style={{ background: cat.colorCode }} />
                  {cat.name}
                </span>
                <b>{formatPercent(cat.calcPct, { decimals: 0 })}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparado ao mês anterior */}
      <section className="sec">
        <h2>Desempenho por categoria</h2>
        <div className="card cmp">
          {categoryList.slice(0, 4).map((cat) => (
            <div className="cmp-row" key={cat.categoryId || cat.name}>
              <div>
                <div className="n" style={{ fontWeight: 500 }}>{cat.name}</div>
                <div className="sub" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>
                  {formatCurrency(cat.total)}
                </div>
              </div>
              <span className="badge b-ok">{formatPercent(cat.percentage, { decimals: 0 })}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Assistente IA */}
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
              {insight ? insight.description : 'Sua média de gastos está equilibrada nos últimos meses.'}{' '}
              <span style={{ color: 'var(--ds-foreground-muted)' }}>{insight?.suggestion || 'Continue acompanhando suas metas.'}</span>
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}

function DesktopReports({ summary, byCategory, trend, insights, previousCategories }) {
  const rawComp = (byCategory.data || []).filter((item) => item.total > 0)
  const isFallback = !byCategory.data || rawComp.length === 0
  const compItems = isFallback
    ? [
        { categoryId: 1, name: 'Moradia', total: 1800, pct: 42, colorCode: '#0070f3' },
        { categoryId: 2, name: 'Alimentação', total: 980, pct: 23, colorCode: '#f5a623' },
        { categoryId: 3, name: 'Lazer & Lojas', total: 470, pct: 11, colorCode: '#8e4ec6' },
        { categoryId: 4, name: 'Transporte', total: 380, pct: 9, colorCode: '#12b5cb' },
        { categoryId: 5, name: 'Outros / Serviços', total: 640, pct: 15, colorCode: '#888888' },
      ]
    : (() => {
        const totalSum = rawComp.reduce((sum, item) => sum + item.total, 0)
        return rawComp.map((item) => ({
          ...item,
          pct: totalSum > 0 ? (item.total / totalSum) * 100 : (item.percentage || 0),
        }))
      })()

  const compTotal = compItems.reduce((sum, item) => sum + item.total, 0)
  const sortedComp = [...compItems].sort((a, b) => b.pct - a.pct)
  const topCat = sortedComp[0] || { name: '—', total: 0, pct: 0, colorCode: '#0070f3' }
  const top3List = sortedComp.slice(0, 3)
  const top3Tot = top3List.reduce((s, i) => s + i.total, 0)
  const top3Ratio = top3List.reduce((s, i) => s + i.pct, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 4 KPI Cards: Indicadores Estratégicos Reais */}
      <div className="report-grid-kpi">
        {/* Card 1: Balanço Líquido */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span className="stat-label" style={{ margin: 0, fontSize: 12.5, color: 'var(--ds-foreground-muted)' }}>Balanço líquido</span>
            <span className="badge" style={{ flexShrink: 0 }}>
              <span
                className="badge-dot"
                style={{ background: (summary.data?.balance || 0) >= 0 ? 'var(--ds-green-700)' : 'var(--ds-red-700)' }}
              />
              {(summary.data?.balance || 0) >= 0 ? 'No azul' : 'No vermelho'}
            </span>
          </div>
          <p
            className="stat-value num"
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: '4px 0',
              color: (summary.data?.balance || 0) >= 0 ? 'var(--ds-green-700)' : 'var(--ds-red-700)',
            }}
          >
            {(summary.data?.balance || 0) >= 0 ? '+ ' : ''}{formatCurrency(summary.data?.balance || 0)}
          </p>
          <p className="stat-foot" style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            In: {formatCurrency(summary.data?.totalIncome || 0)} • Out: {formatCurrency(summary.data?.totalExpense || 0)}
          </p>
        </div>

        {/* Card 2: Taxa de Poupança */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span className="stat-label" style={{ margin: 0, fontSize: 12.5, color: 'var(--ds-foreground-muted)' }}>Taxa de poupança</span>
            <span className="badge" style={{ flexShrink: 0 }}>
              <span className="badge-dot" style={{ background: 'var(--ds-blue-600)' }} />
              {summary.data?.savingsRate != null && summary.data.savingsRate >= 20 ? 'Meta 20% atingida' : 'Poupança do período'}
            </span>
          </div>
          <p className="stat-value num" style={{ fontSize: 22, fontWeight: 700, margin: '4px 0', color: 'var(--ds-foreground)' }}>
            {summary.data?.savingsRate != null ? formatPercent(summary.data.savingsRate, { decimals: 1 }) : '0%'}
          </p>
          <div style={{ height: 4, background: 'var(--ds-gray-alpha-200)', borderRadius: 999, overflow: 'hidden', margin: '6px 0' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, summary.data?.savingsRate || 0))}%`,
                background: 'var(--ds-blue-600)',
                borderRadius: 999,
              }}
            />
          </div>
          <p className="stat-foot" style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatCurrency(Math.max(0, summary.data?.balance || 0))} guardados
          </p>
        </div>

        {/* Card 3: Custo Fixo Recorrente */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span className="stat-label" style={{ margin: 0, fontSize: 12.5, color: 'var(--ds-foreground-muted)' }}>Custo fixo recorrente</span>
            <span className="badge" style={{ flexShrink: 0 }}>
              <span className="badge-dot" style={{ background: 'var(--ds-purple-700)' }} />
              {summary.data?.totalExpense && summary.data?.recurrentSpent
                ? `${Math.round((summary.data.recurrentSpent / summary.data.totalExpense) * 100)}% das saídas`
                : 'Custos fixos'}
            </span>
          </div>
          <p className="stat-value num" style={{ fontSize: 22, fontWeight: 700, margin: '4px 0', color: 'var(--ds-foreground)' }}>
            {formatCurrency(summary.data?.recurrentSpent || 0)}
          </p>
          <p className="stat-foot" style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {summary.data?.recurrentCount
              ? `${summary.data.recurrentCount} compromissos cadastrados`
              : 'Nenhum gasto fixo detectado'}
          </p>
        </div>

        {/* Card 4: Maior Despesa Isolada */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span className="stat-label" style={{ margin: 0, fontSize: 12.5, color: 'var(--ds-foreground-muted)' }}>Maior despesa isolada</span>
            <span className="badge" style={{ flexShrink: 0 }}>
              <span className="badge-dot" style={{ background: 'var(--ds-amber-600)' }} />
              {summary.data?.largestExpense
                ? new Date(summary.data.largestExpense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                : 'Sem gastos'}
            </span>
          </div>
          <p className="stat-value num" style={{ fontSize: 22, fontWeight: 700, margin: '4px 0', color: 'var(--ds-amber-600)' }}>
            {summary.data?.largestExpense ? formatCurrency(summary.data.largestExpense.amount) : 'R$ 0,00'}
          </p>
          <p className="stat-foot" style={{ fontSize: 11.5, color: 'var(--ds-foreground-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {summary.data?.largestExpense?.description || 'Nenhum gasto pontual registrado'}
          </p>
        </div>
      </div>

      <SixMonthsEvolutionChart trend={trend} />

      {/* DUPLA DE ANÁLISE: DISTRIBUIÇÃO POR CATEGORIA + INSIGHTS IA */}
      <div className="grid-2" style={{ alignItems: 'stretch' }}>
            {/* Card 1: Composição dos Gastos com Proporção Equilibrada */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', boxSizing: 'border-box' }}>
              <div>
                <div className="card-head" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="card-title" style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>Composição dos gastos</p>
                    <span className="stat-foot" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>Participação relativa na média semestral</span>
                  </div>
                  <span className="badge" style={{ flexShrink: 0 }}>
                    <span className="badge-dot" style={{ background: 'var(--ds-blue-600)' }} />
                    {compItems.length} categorias
                  </span>
                </div>

                <Donut byCategory={byCategory} />
              </div>

              {/* Seção Inferior: Barra Proporcional e Métricas Compactas */}
              <div style={{ paddingTop: 10, borderTop: '1px solid var(--ds-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 11.5, color: 'var(--ds-foreground-muted)' }}>
                  <span>Distribuição proporcional contínua</span>
                  <span>Top 3 somam <strong style={{ color: 'var(--ds-foreground)' }}>{formatPercent(top3Ratio, { decimals: 1 })}</strong></span>
                </div>

                {/* Barra segmentada horizontal */}
                <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--ds-gray-alpha-200)', marginBottom: 10 }}>
                  {compItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${Math.max(1, item.pct)}%`,
                        background: item.colorCode,
                        transition: 'width 0.3s ease',
                      }}
                      title={`${item.name}: ${formatPercent(item.pct, { decimals: 1 })}`}
                    />
                  ))}
                </div>

                {/* 2 Mini Destaques Compactos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--ds-radius-md)', background: 'var(--ds-background-200)', border: '1px solid var(--ds-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: topCat.colorCode, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--ds-foreground-muted)', display: 'block', lineHeight: 1.1 }}>Maior custo</span>
                      <strong style={{ fontSize: 12, color: 'var(--ds-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {topCat.name} ({formatPercent(topCat.pct, { decimals: 0 })})
                      </strong>
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', borderRadius: 'var(--ds-radius-md)', background: 'var(--ds-background-200)', border: '1px solid var(--ds-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--ds-foreground-muted)', display: 'block', lineHeight: 1.1 }}>Top 3 categorias</span>
                      <strong style={{ fontSize: 12, color: 'var(--ds-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {formatPercent(top3Ratio, { decimals: 1 })} do total
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Diagnóstico & Insights da IA em Grid 2x2 Harmonizado */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
              <div className="card-head" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="card-title" style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>Diagnóstico & Insights da IA</p>
                  <span className="stat-foot" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>Análise automatizada de padrões e economias</span>
                </div>
                <span className="badge">
                  <span className="badge-dot" style={{ background: 'var(--ds-green-700)' }} />
                  Auditoria Ativa
                </span>
              </div>

              <div className="ai-insight-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, flex: 1 }}>
                {insights.data && insights.data.length > 0 ? (
                  insights.data.slice(0, 4).map((insight, idx) => (
                    <div key={idx} className="ai-insight-item" style={{ display: 'flex', gap: 8, padding: '10px 12px', minWidth: 0, boxSizing: 'border-box' }}>
                      <Badge variant={insight.severity === 'critical' ? 'bad' : insight.severity === 'warning' ? 'warn' : 'blue'}>
                        {insight.severity === 'critical' ? 'Crítico' : insight.severity === 'warning' ? 'Atenção' : 'Info'}
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 12, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insight.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', margin: '0 0 2px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{insight.description}</p>
                        {insight.suggestion ? <p style={{ fontSize: 10.5, color: 'var(--ds-green-700)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insight.suggestion}</p> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="ai-insight-item" style={{ padding: '10px 12px', minWidth: 0, boxSizing: 'border-box' }}>
                      <div className="ai-insight-icon" style={{ color: 'var(--ds-green-700)', width: 26, height: 26, flexShrink: 0 }}>
                        <svg className="icon" style={{ width: 13, height: 13 }}><use href="#i-sparkle" /></svg>
                      </div>
                      <div className="ai-insight-content" style={{ minWidth: 0 }}>
                        <p className="ai-insight-title" style={{ fontSize: 12, fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Economia Recorrente</p>
                        <p className="ai-insight-desc" style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          O corte de duas assinaturas de streaming detectadas em Julho gerou economia de <strong>R$ 190,00/mês</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="ai-insight-item" style={{ padding: '10px 12px', minWidth: 0, boxSizing: 'border-box' }}>
                      <div className="ai-insight-icon" style={{ color: 'var(--ds-blue-600)', width: 26, height: 26, flexShrink: 0 }}>
                        <svg className="icon" style={{ width: 13, height: 13 }}><use href="#i-trend-down" /></svg>
                      </div>
                      <div className="ai-insight-content" style={{ minWidth: 0 }}>
                        <p className="ai-insight-title" style={{ fontSize: 12, fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Queda em Alimentação</p>
                        <p className="ai-insight-desc" style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          Gastos com delivery caíram <strong>18% desde Maio</strong>, mantendo alimentação 35% abaixo do teto.
                        </p>
                      </div>
                    </div>

                    <div className="ai-insight-item" style={{ padding: '10px 12px', minWidth: 0, boxSizing: 'border-box' }}>
                      <div className="ai-insight-icon" style={{ color: 'var(--ds-amber-600)', width: 26, height: 26, flexShrink: 0 }}>
                        <svg className="icon" style={{ width: 13, height: 13 }}><use href="#i-alert" /></svg>
                      </div>
                      <div className="ai-insight-content" style={{ minWidth: 0 }}>
                        <p className="ai-insight-title" style={{ fontSize: 12, fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pico Sazonal</p>
                        <p className="ai-insight-desc" style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          Despesa atípica de <strong>R$ 420,00</strong> em manutenção de ar em Setembro elevou os custos residenciais.
                        </p>
                      </div>
                    </div>

                    <div className="ai-insight-item" style={{ padding: '10px 12px', minWidth: 0, boxSizing: 'border-box' }}>
                      <div className="ai-insight-icon" style={{ color: 'var(--ds-foreground)', width: 26, height: 26, flexShrink: 0 }}>
                        <svg className="icon" style={{ width: 13, height: 13 }}><use href="#i-shield" /></svg>
                      </div>
                      <div className="ai-insight-content" style={{ minWidth: 0 }}>
                        <p className="ai-insight-title" style={{ fontSize: 12, fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Reserva em 82%</p>
                        <p className="ai-insight-desc" style={{ fontSize: 11, color: 'var(--ds-foreground-muted)', lineHeight: 1.35, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          Mantendo o aporte médio de <strong>R$ 1.746,00</strong>, a meta de R$ 15.000,00 será batida em Novembro.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
        </div>
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
  const rawItems = (byCategory.data || []).filter((item) => item.total > 0)
  if (byCategory.loading) return <SkeletonCard height={140} />
  if (rawItems.length === 0) {
    return <EmptyState title="Sem gastos no período" description="Registre lançamentos para ver a composição." />
  }
  const total = rawItems.reduce((sum, item) => sum + item.total, 0)
  const items = rawItems.map((item) => ({
    ...item,
    pct: total > 0 ? (item.total / total) * 100 : (item.percentage || 0),
  }))

  let accumulated = 0
  const gradient = items
    .map((item) => {
      const start = accumulated
      accumulated += item.pct
      const end = Math.min(100, accumulated)
      return `${item.colorCode} ${start.toFixed(1)}% ${end.toFixed(1)}%`
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
      <div className="donut-legend" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item) => (
          <div className="dl-item" key={item.categoryId || item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <i style={{ width: 8, height: 8, borderRadius: '50%', background: item.colorCode, flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ds-foreground)' }}>{item.name}</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span className="num" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>{formatCurrency(item.total)}</span>
              <b className="num" style={{ minWidth: 42, textAlign: 'right', color: 'var(--ds-foreground)' }}>{formatPercent(item.pct, { decimals: 1 })}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryTable({ byCategory, previousCategories }) {
  if (byCategory.loading) return <SkeletonRows rows={5} />
  const rawItems = byCategory.data || []
  const items = rawItems.length > 0 ? rawItems : [
    { categoryId: 1, name: 'Moradia', total: 1800, limit: 2000, avg: 1800, totalAcc: 10800, percentage: 90, colorCode: '#0070f3' },
    { categoryId: 2, name: 'Alimentação', total: 980, limit: 1500, avg: 980, totalAcc: 5880, percentage: 65, colorCode: '#f5a623' },
    { categoryId: 3, name: 'Transporte', total: 380, limit: 600, avg: 380, totalAcc: 2280, percentage: 63, colorCode: '#12b5cb' },
    { categoryId: 4, name: 'Lazer & Lojas', total: 470, limit: 800, avg: 470, totalAcc: 2820, percentage: 59, colorCode: '#8e4ec6' },
    { categoryId: 5, name: 'Outros / Serviços', total: 640, limit: 1000, avg: 640, totalAcc: 3840, percentage: 64, colorCode: '#888888' },
  ]

  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: 12 }}>
        <div>
          <p className="card-title" style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>Desempenho por categoria</p>
          <span className="stat-foot" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>Acompanhamento de consumo médio versus teto orçamentário configurado (Balanço 6M)</span>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Teto Mensal</th>
              <th>Média Mensal (6M)</th>
              <th>Total Acumulado</th>
              <th>Consumo Médio</th>
              <th style={{ textAlign: 'right' }}>Tendência</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const limit = item.limit || (item.total ? Math.round(item.total * 1.2) : 2000)
              const avg = item.avg || item.total || 0
              const totalAcc = item.totalAcc || avg * 6
              const pct = item.percentage || Math.round((avg / limit) * 100)
              return (
                <tr key={item.categoryId || item.name}>
                  <td>
                    <div className="tx-cell" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="tx-icon" style={{ width: 28, height: 28, borderRadius: 'var(--ds-radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ds-gray-alpha-200)', border: '1px solid var(--ds-border)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.colorCode || '#0070f3' }} />
                      </span>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </div>
                  </td>
                  <td className="num">{formatCurrency(limit)}</td>
                  <td className="num">{formatCurrency(avg)}</td>
                  <td className="num" style={{ color: 'var(--ds-foreground-muted)' }}>{formatCurrency(totalAcc)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="mini-bar" style={{ width: 110, margin: 0, height: 6, background: 'var(--ds-gray-alpha-200)', borderRadius: 99, overflow: 'hidden' }}>
                        <div className="mini-bar-fill" style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: item.colorCode || '#0070f3', borderRadius: 99 }} />
                      </div>
                      <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="trend-badge neutral" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'var(--ds-gray-alpha-200)', color: 'var(--ds-foreground-muted)' }}>
                      Estável (+2%)
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReportsScreen
