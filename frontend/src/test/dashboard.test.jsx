import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardScreen } from '../views/dashboard/DashboardScreen'
import { dashboardService, reportService, insightService, userService } from '../services'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    dashboardService: {
      ...original.dashboardService,
      overview: vi.fn(),
      weeklyExpenses: vi.fn(),
      recentTransactions: vi.fn(),
      budgetMeters: vi.fn(),
    },
    reportService: {
      ...original.reportService,
      daily: vi.fn(),
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

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UiProvider>
          <ToastProvider>
            <DashboardScreen />
          </ToastProvider>
        </UiProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const OVERVIEW = {
  balance: 4286.5,
  income: 7850,
  expense: 3563,
  expenseToCeilingPercentage: 56,
  incomeChangePct: 8.4,
  expenseChangePct: 14.2,
  currency: 'BRL',
  updatedAt: new Date().toISOString(),
}

const RECENT = [
  {
    id: 1,
    type: 'expense',
    description: 'Mercado Pão de Açúcar',
    value: 186.4,
    transactionDate: new Date().toISOString(),
    paymentMethod: 'cartao',
    category: { id: 1, name: 'Alimentação', colorCode: '#ef4444', icon: 'Utensils' },
  },
]

describe('DashboardScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    dashboardService.overview.mockResolvedValue(OVERVIEW)
    dashboardService.weeklyExpenses.mockResolvedValue({
      total: 994,
      dailyAverage: 142,
      days: [
        { weekday: 'seg', value: 45, percentage: 50 },
        { weekday: 'ter', value: 90, percentage: 100 },
      ],
    })
    dashboardService.recentTransactions.mockResolvedValue(RECENT)
    dashboardService.budgetMeters.mockResolvedValue([
      { categoryId: 2, name: 'Moradia', colorCode: '#f5a623', icon: 'Home', spent: 1800, limit: 2000, percentage: 90 },
    ])
    insightService.list.mockResolvedValue([])
    reportService.daily.mockResolvedValue([])
    userService.profile.mockResolvedValue({ id: 1, displayName: 'Fred' })
  })

  it('renderiza kpis de saldo entradas e saidas', async () => {
    renderDashboard()

    expect(await screen.findByText('R$ 4.286,50')).toBeInTheDocument()
    expect(screen.getByText('R$ 7.850,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 3.563,00')).toBeInTheDocument()
    expect(screen.getByText('+8,4% vs mês anterior')).toBeInTheDocument()
  })

  it('mostra grafico da semana com dias e total', async () => {
    renderDashboard()

    expect(await screen.findByText('R$ 135,00')).toBeInTheDocument()
    expect(screen.getByText('seg')).toBeInTheDocument()
    expect(screen.getByText('ter')).toBeInTheDocument()
  })

  it('alterna o grafico para visao mensal', async () => {
    reportService.daily.mockResolvedValue([
      { day: '01', value: 100 },
      { day: '02', value: 50 },
    ])
    renderDashboard()

    fireEvent.click(await screen.findByRole('radio', { name: 'Mês' }))
    await waitFor(() => expect(reportService.daily).toHaveBeenCalled())
  })

  it('lista lancamentos recentes e medidores de orcamento', async () => {
    renderDashboard()

    expect(await screen.findByText('Mercado Pão de Açúcar')).toBeInTheDocument()
    expect(screen.getByText('Moradia')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.800,00 / R$ 2.000,00')).toBeInTheDocument()
  })
})
