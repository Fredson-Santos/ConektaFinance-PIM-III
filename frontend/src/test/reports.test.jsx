import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ReportsScreen } from '../views/reports/ReportsScreen'
import { reportService, insightService } from '../services'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    reportService: {
      ...original.reportService,
      summary: vi.fn(),
      byCategory: vi.fn(),
      trend: vi.fn(),
      daily: vi.fn(),
      exportCsv: vi.fn(),
      exportJson: vi.fn(),
    },
    insightService: {
      ...original.insightService,
      list: vi.fn(),
    },
    userService: {
      ...original.userService,
      profile: vi.fn(),
    },
  }
})

vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

const SUMMARY = {
  totalIncome: 5000,
  totalExpense: 1650,
  balance: 3350,
  savingsRate: 67,
  averageMonthlyExpense: 275,
  largestExpense: { amount: 1200, description: 'Aluguel', date: new Date().toISOString() },
  recurrentSpent: 39.9,
  recurrentCount: 1,
  previousPeriod: { incomeChangePct: 10, expenseChangePct: -5 },
}

const BY_CATEGORY = [
  { categoryId: 1, name: 'Moradia', colorCode: '#f5a623', icon: 'Home', total: 1200, percentage: 72.7 },
  { categoryId: 2, name: 'Alimentação', colorCode: '#ef4444', icon: 'Utensils', total: 450, percentage: 27.3 },
]

const TREND = [
  { period: '05/2026', income: 5000, expense: 1600, saved: 3400 },
  { period: '06/2026', income: 5200, expense: 1650, saved: 3550 },
]

function renderReports() {
  return render(
    <MemoryRouter>
      <UiProvider>
        <ToastProvider>
          <ReportsScreen />
        </ToastProvider>
      </UiProvider>
    </MemoryRouter>,
  )
}

describe('ReportsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    reportService.summary.mockResolvedValue(SUMMARY)
    reportService.byCategory.mockResolvedValue(BY_CATEGORY)
    reportService.trend.mockResolvedValue(TREND)
    insightService.list.mockResolvedValue([
      { title: 'Alimentação em alta', description: 'Gastos subiram 10%', suggestion: 'Corte delivery', severity: 'warning' },
    ])
  })

  it('renderiza kpis de media mensal e economia acumulada', async () => {
    renderReports()

    expect(await screen.findByText('Média mensal de gastos')).toBeInTheDocument()
    expect(screen.getByText('Economia acumulada (6M)')).toBeInTheDocument()
    expect(screen.getByText('R$ 6.950,00')).toBeInTheDocument()
    expect(screen.getByText('Desempenho por categoria')).toBeInTheDocument()
    expect(screen.getAllByText('Moradia').length).toBeGreaterThan(1)
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument()
  })

  it('mostra insights da ia com severidade', async () => {
    renderReports()

    expect(await screen.findByText('Alimentação em alta')).toBeInTheDocument()
    expect(screen.getByText('Corte delivery')).toBeInTheDocument()
    expect(screen.getByText('Atenção')).toBeInTheDocument()
  })

  it('exibe donut com composicao por categoria', async () => {
    renderReports()

    await screen.findByText('Composição dos gastos')
    expect(screen.getAllByText('72,7%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('27,3%').length).toBeGreaterThan(0)
    expect(screen.getByText('R$ 1,6 mil')).toBeInTheDocument()
  })

  it('troca o periodo para mes e mostra exportacoes', async () => {
    renderReports()

    fireEvent.click(await screen.findByRole('radio', { name: 'Mês' }))
    await waitFor(() => expect(reportService.summary).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: /exportar pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument()
  })
})
