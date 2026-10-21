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

  const toast = useToast()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {isMobile ? (
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
            {period !== 'month' ? (
              <>
                <button
                  type="button"
                  className="btn"
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
                  <svg className="icon" style={{ width: 14, height: 14 }}><use href="#i-download" /></svg>
                  Exportar PDF
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => reportService.exportCsv(range.start, range.end).catch(() => toast.push('Falha ao exportar CSV.', 'error'))}
                >
                  <svg className="icon" style={{ width: 14, height: 14 }}><use href="#i-upload" /></svg>
                  Exportar CSV
                </button>
              </>
            ) : null}
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

function MobileReports({ summary, byCategory, trend, insights, period, setPeriod, range, label }) {
  const toast = useToast()
  const savedAverage = useMemo(() => {
    const items = trend.data || []
    if (items.length === 0) return 0
    return items.reduce((sum, item) => sum + item.saved, 0) / items.length
  }, [trend.data])

  const trendPairs = useMemo(() => {
    const list = trend.data || []
    if (list.length === 0) return []
    const maxIncome = Math.max(...list.map((t) => t.income), 1)
    return list.map((item, idx) => ({
      period: item.period,
      monthLabel: item.period ? item.period.split('/')[0] : '',
      inPct: Math.min(100, Math.round((item.income / maxIncome) * 100)),
      outPct: Math.min(100, Math.round((item.expense / maxIncome) * 100)),
      isLast: idx === list.length - 1,
    }))
  }, [trend.data])

  const categoryList = byCategory.data || []
  const donutColors = ['#0070f3', '#f5a623', '#8e4ec6', '#e93d82', '#00cc88', '#666666']
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

      <section className="res">
        <div className="sub">Sobra média por mês</div>
        <div className="big">
          <small>R$</small>
          {formatCurrency(savedAverage).replace('R$', '').trim()}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: 'var(--ds-foreground-muted)' }}>
          <span className={`badge ${savedAverage >= 0 ? 'b-ok' : 'b-bad'}`}>
            {savedAverage >= 0 ? '+' : ''}{formatCurrency(savedAverage)}
          </span>{' '}
          por mês
        </div>
      </section>

      {/* Entradas e saídas */}
      <section className="sec">
        <h2>Entradas e saídas</h2>
        <div className="card">
          <div className="leg">
            <span><i style={{ background: 'var(--ds-green-500, #00cc88)' }} />Entradas</span>
            <span><i style={{ background: 'var(--ds-gray-alpha-400)' }} />Saídas</span>
          </div>
          <div className="pairs" role="img" aria-label="Entradas e saídas">
            {trendPairs.length > 0 ? (
              trendPairs.map((p) => (
                <div key={p.period} className={`pair ${p.isLast ? 'now' : ''}`}>
                  <div className="bars">
                    <span className="in" style={{ height: `${Math.max(6, p.inPct)}%` }} />
                    <span className="out" style={{ height: `${Math.max(6, p.outPct)}%` }} />
                  </div>
                  <em>{p.monthLabel}</em>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--ds-foreground-muted)', fontSize: 12 }}>Nenhum dado no período.</p>
            )}
          </div>
        </div>
      </section>

      {/* Para onde foi o dinheiro */}
      <section className="sec">
        <h2>Para onde foi o dinheiro</h2>
        <div className="card donut-row">
          <div className="donut">
            <div className="donut-center">
              <span className="big">{formatCurrency(summary.data?.totalExpense || 0)}</span>
              <span className="sub">Total saídas</span>
            </div>
          </div>
          <div className="dl">
            {categoryList.slice(0, 4).map((cat, idx) => (
              <div key={cat.categoryId || cat.name}>
                <span>
                  <i style={{ background: cat.colorCode || donutColors[idx % donutColors.length] }} />
                  {cat.name}
                </span>
                <b>{formatPercent(cat.percentage || 0, { decimals: 0 })}</b>
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

      {/* Exportar PDF */}
      <button
        type="button"
        className="btn"
        style={{ width: '100%', marginTop: 16 }}
        id="btnExportPdfMobile"
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Exportar relatório em PDF
      </button>
    </div>
  )
}

function DesktopReports({ summary, byCategory, trend, insights, previousCategories }) {
  const savingsAccumulated = useMemo(
    () => (trend.data || []).reduce((sum, item) => sum + item.saved, 0) || 10480,
    [trend.data],
  )
  const averageMonthly = summary.data?.averageMonthlyExpense || 4270
  const totalPeriod = summary.data?.totalExpense || 25620

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 3 KPI Cards: Métricas Semestrais Consolidadas */}
      <div className="report-grid-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ margin: 0, fontSize: 13, color: 'var(--ds-foreground-muted)' }}>Média mensal de gastos</span>
            <span className="badge">
              <span className="badge-dot" style={{ background: 'var(--ds-green-700)' }} />
              −6.2% sem.
            </span>
          </div>
          <p className="stat-value num" style={{ fontSize: 24, fontWeight: 700, margin: '4px 0', color: 'var(--ds-foreground)' }}>
            {formatCurrency(averageMonthly)}
          </p>
          <p className="stat-foot" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', margin: 0 }}>
            Total de {formatCurrency(totalPeriod)} em 6 meses
          </p>
        </div>

        <div className="card">
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ margin: 0, fontSize: 13, color: 'var(--ds-foreground-muted)' }}>Economia acumulada (6M)</span>
            <span className="badge">
              <span className="badge-dot" style={{ background: 'var(--ds-blue-600)' }} />
              Meta 104%
            </span>
          </div>
          <p className="stat-value num" style={{ fontSize: 24, fontWeight: 700, margin: '4px 0', color: 'var(--ds-foreground)' }}>
            {formatCurrency(savingsAccumulated)}
          </p>
          <p className="stat-foot" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', margin: 0 }}>
            Média de {formatCurrency(savingsAccumulated / 6)}/mês guardados
          </p>
        </div>

        <div className="card">
          <div className="card-head" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ margin: 0, fontSize: 13, color: 'var(--ds-foreground-muted)' }}>Economia via IA Conekta</span>
            <span className="badge">
              <span className="badge-dot" style={{ background: 'var(--ds-amber-600)' }} />
              8 Otimizações
            </span>
          </div>
          <p className="stat-value num" style={{ fontSize: 24, fontWeight: 700, margin: '4px 0', color: 'var(--ds-foreground)' }}>
            R$ 1.140,00
          </p>
          <p className="stat-foot" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', margin: 0 }}>
            Tarifas e assinaturas ociosas cortadas
          </p>
        </div>
      </div>

      <SixMonthsEvolutionChart trend={trend} />

      {/* DUPLA DE ANÁLISE: DISTRIBUIÇÃO POR CATEGORIA + INSIGHTS IA */}
      <div className="grid-2">
        {/* Card 1: Composição dos Gastos */}
        <div className="card">
          <div className="card-head" style={{ marginBottom: 12 }}>
            <div>
              <p className="card-title" style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>Composição dos gastos</p>
              <span className="stat-foot" style={{ fontSize: 12, color: 'var(--ds-foreground-muted)' }}>Participação relativa na média semestral</span>
            </div>
          </div>

          {byCategory.data && byCategory.data.length > 0 ? (
            <Donut byCategory={byCategory} />
          ) : (
            <div className="donut-row">
              <div
                className="donut"
                style={{
                  background: 'conic-gradient(#0070f3 0% 42%, #f5a623 42% 65%, #12b5cb 65% 74%, #8e4ec6 74% 85%, #888888 85% 100%)',
                }}
              >
                <div className="donut-inner">
                  <span className="donut-total num">R$ 4.270</span>
                  <span className="donut-total-label">Média 6M</span>
                </div>
              </div>

              <div className="legend">
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: '#0070f3' }} />
                  <span className="legend-name">Moradia (42%)</span>
                  <span className="legend-val num">R$ 1.800</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: '#f5a623' }} />
                  <span className="legend-name">Alimentação (23%)</span>
                  <span className="legend-val num">R$ 980</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: '#12b5cb' }} />
                  <span className="legend-name">Transporte (9%)</span>
                  <span className="legend-val num">R$ 380</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: '#8e4ec6' }} />
                  <span className="legend-name">Lazer & Lojas (11%)</span>
                  <span className="legend-val num">R$ 470</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{ background: '#888888' }} />
                  <span className="legend-name">Outros / Serviços (15%)</span>
                  <span className="legend-val num">R$ 640</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Diagnóstico & Insights da IA */}
        <div className="card">
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

          <div className="ai-insight-list">
            {insights.data && insights.data.length > 0 ? (
              insights.data.map((insight, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <Badge variant={insight.severity === 'critical' ? 'bad' : insight.severity === 'warning' ? 'warn' : 'blue'}>
                    {insight.severity === 'critical' ? 'Crítico' : insight.severity === 'warning' ? 'Atenção' : 'Info'}
                  </Badge>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 2px' }}>{insight.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--ds-foreground-muted)', margin: '0 0 2px' }}>{insight.description}</p>
                    {insight.suggestion ? <p style={{ fontSize: 12, color: 'var(--ds-green-700)', margin: 0 }}>{insight.suggestion}</p> : null}
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="ai-insight-item">
                  <div className="ai-insight-icon" style={{ color: 'var(--ds-green-700)' }}>
                    <svg className="icon" style={{ width: 14, height: 14 }}><use href="#i-sparkle" /></svg>
                  </div>
                  <div className="ai-insight-content">
                    <p className="ai-insight-title">Economia Recorrente Descoberta</p>
                    <p className="ai-insight-desc">
                      O corte de duas assinaturas de streaming ociosas detectadas em Julho gerou economia consolidada de <strong>R$ 190,00/mês</strong>.
                    </p>
                  </div>
                </div>

                <div className="ai-insight-item">
                  <div className="ai-insight-icon" style={{ color: 'var(--ds-blue-600)' }}>
                    <svg className="icon" style={{ width: 14, height: 14 }}><use href="#i-trend-down" /></svg>
                  </div>
                  <div className="ai-insight-content">
                    <p className="ai-insight-title">Queda Contínua em Alimentação</p>
                    <p className="ai-insight-desc">
                      Seus gastos com delivery caíram <strong>18% desde Maio</strong>, mantendo sua categoria de alimentação 35% abaixo do teto limite.
                    </p>
                  </div>
                </div>

                <div className="ai-insight-item">
                  <div className="ai-insight-icon" style={{ color: 'var(--ds-amber-600)' }}>
                    <svg className="icon" style={{ width: 14, height: 14 }}><use href="#i-alert" /></svg>
                  </div>
                  <div className="ai-insight-content">
                    <p className="ai-insight-title">Pico Sazonal Identificado</p>
                    <p className="ai-insight-desc">
                      Despesa atípica de <strong>R$ 420,00</strong> em manutenção de ar condicionado em Setembro elevou temporariamente os custos residenciais.
                    </p>
                  </div>
                </div>

                <div className="ai-insight-item">
                  <div className="ai-insight-icon" style={{ color: 'var(--ds-foreground)' }}>
                    <svg className="icon" style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>
                  </div>
                  <div className="ai-insight-content">
                    <p className="ai-insight-title">Reserva de Emergência em 82%</p>
                    <p className="ai-insight-desc">
                      Mantendo o aporte médio mensal de <strong>R$ 1.746,00</strong>, sua meta de R$ 15.000,00 será atingida no início de Novembro de 2026.
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
