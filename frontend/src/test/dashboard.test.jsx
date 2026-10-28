import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardScreen } from '../views/dashboard/DashboardScreen'
import { dashboardService, reportService, insightService, userService } from '../services'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'
import { isSameWeekday, useToday } from '../hooks/useToday'

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
  afterEach(() => {
    vi.useRealTimers()
  })

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
    expect(document.getElementById('valDespesasMobile')).toHaveTextContent('R$ 3.563,00')
    expect(screen.getByTestId('ceiling-spent')).toHaveTextContent('R$ 3.563,00')
    expect(screen.getByText('+8,4% vs mês anterior')).toBeInTheDocument()
  })

  it('exibe saldo negativo com sinal e cor vermelha de alerta', async () => {
    dashboardService.overview.mockResolvedValue({ ...OVERVIEW, balance: -350 })
    renderDashboard()

    const saldo = await screen.findByText('− R$ 350,00')
    expect(saldo.id).toBe('valSaldoMobile')
    expect(saldo.style.color).toBe('var(--ds-red-700)')

    const badge = screen.getByText('+8,4% vs mês anterior').closest('.badge')
    expect(badge).toHaveClass('badge-danger')
  })

  it('mostra grafico da semana com dias e total', async () => {
    renderDashboard()

    expect(await screen.findByText('R$ 135,00')).toBeInTheDocument()
    expect(screen.getByText('seg')).toBeInTheDocument()
    expect(screen.getByText('ter')).toBeInTheDocument()
  })

  it('garante que o grafico de gastos e exclusivo da semana sem filtro de mes', async () => {
    renderDashboard()

    expect(await screen.findByText('Distribuição de Gastos da Semana')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Mês' })).not.toBeInTheDocument()
    expect(screen.queryByText('Acumulado do Mês')).not.toBeInTheDocument()
    expect(reportService.daily).not.toHaveBeenCalled()
  })

  it('lista lancamentos recentes e medidores de orcamento', async () => {
    renderDashboard()

    expect(await screen.findByText('Mercado Pão de Açúcar')).toBeInTheDocument()
    expect(screen.getByText('Moradia')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.800,00 / R$ 2.000,00')).toBeInTheDocument()
  })

  it('exibe estado vazio e botao para adicionar categoria quando nao ha medidores de orcamento', async () => {
    dashboardService.budgetMeters.mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByText('Nenhum orçamento configurado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adicionar categoria/i })).toBeInTheDocument()
    expect(screen.queryByText('Moradia')).not.toBeInTheDocument()
  })

  it('destaca em azul apenas a barra do dia atual com indicacao de hoje', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 27, 10, 0, 0)) // terça-feira
    renderDashboard()

    const today = await screen.findByLabelText('Hoje, ter: R$ 90,00')
    expect(today).toHaveClass('now')
    expect(screen.getByLabelText('seg: R$ 45,00')).not.toHaveClass('now')
    expect(document.querySelectorAll('[data-today]')).toHaveLength(1)

    fireEvent.mouseEnter(today)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Hoje')
    expect(screen.getByRole('tooltip')).toHaveTextContent('R$ 90,00')
  })

  it('destaca o dia atual tambem no grafico desktop', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 26, 10, 0, 0)) // segunda-feira
    renderDashboard()

    const today = await screen.findByLabelText('Hoje, SEG: R$ 45,00')
    expect(today).toHaveClass('spend-col', 'active')
    expect(document.querySelectorAll('.spend-col.active')).toHaveLength(1)
  })
})

describe('useToday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('atualiza o dia automaticamente na virada da meia-noite', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 27, 23, 59, 0))
    const { result } = renderHook(() => useToday())
    expect(isSameWeekday('ter', result.current)).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000)
    })

    expect(isSameWeekday('qua', result.current)).toBe(true)
  })

  it('normaliza rotulos com acento e caixa alta', () => {
    const saturday = new Date(2026, 9, 31)
    expect(isSameWeekday('SÁB', saturday)).toBe(true)
    expect(isSameWeekday('sab', saturday)).toBe(true)
    expect(isSameWeekday('dom', saturday)).toBe(false)
  })
})
