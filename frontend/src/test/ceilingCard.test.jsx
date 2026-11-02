import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CeilingCard, ceilingStatus, ceilingUsage } from '../components/dashboard/CeilingCard'
import { TransactionsScreen } from '../views/transactions/TransactionsScreen'
import { categoryService, dashboardService, reportService, transactionService, userService } from '../services'
import { AuthProvider } from '../context/AuthContext'
import { UiProvider, useUi } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    userService: { ...original.userService, profile: vi.fn(), updatePreferences: vi.fn() },
    dashboardService: { ...original.dashboardService, overview: vi.fn() },
    transactionService: { ...original.transactionService, list: vi.fn() },
    categoryService: { ...original.categoryService, list: vi.fn() },
    reportService: { ...original.reportService, byCategory: vi.fn() },
  }
})

function Providers({ children }) {
  return (
    <MemoryRouter>
      <AuthProvider>
        <UiProvider>
          <ToastProvider>{children}</ToastProvider>
        </UiProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

function NotifyButton() {
  const { notifyDataChanged } = useUi()
  return (
    <button type="button" onClick={notifyDataChanged}>
      simular novo lançamento
    </button>
  )
}

describe('calculo do consumo do limite', () => {
  it('calcula percentual, restante e excedente', () => {
    expect(ceilingUsage(1500, 2000)).toEqual({ percentage: 75, remaining: 500, exceeded: 0, hasCeiling: true })
    expect(ceilingUsage(2500, 2000)).toMatchObject({ percentage: 125, remaining: 0, exceeded: 500 })
    expect(ceilingUsage(300, 0)).toMatchObject({ hasCeiling: false, percentage: 0 })
  })

  it('classifica as faixas de alerta', () => {
    expect(ceilingStatus(79.9).tone).toBe('ok')
    expect(ceilingStatus(80).tone).toBe('warn')
    expect(ceilingStatus(99.9).tone).toBe('warn')
    expect(ceilingStatus(100).tone).toBe('over')
  })
})

describe('CeilingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('conekta_token', 'token')
    userService.profile.mockResolvedValue({ id: 1, fullName: 'Ana', monthlyCeiling: 3500, onboardingCompleted: true })
  })

  it('usa o teto do perfil definido no onboarding', async () => {
    render(<Providers><CeilingCard spent={2975} /></Providers>)

    expect(await screen.findByText('R$ 3.500,00')).toBeInTheDocument()
    expect(screen.getByText('85% do teto utilizado')).toBeInTheDocument()
    expect(screen.getByText('R$ 525,00')).toBeInTheDocument()
    expect(screen.getByText('Atenção')).toBeInTheDocument()
    expect(screen.getByLabelText('Consumo do Limite')).toHaveAttribute('data-tone', 'warn')
  })

  it('sinaliza limite atingido com valor excedente', async () => {
    render(<Providers><CeilingCard spent={4000} /></Providers>)

    expect(await screen.findByText('Limite atingido')).toBeInTheDocument()
    expect(screen.getByText(/excedido em/i)).toHaveTextContent('R$ 500,00')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('edita o teto sem sair do dashboard', async () => {
    userService.updatePreferences.mockResolvedValue({ monthlyCeiling: 5000 })
    render(<Providers><CeilingCard spent={2975} /></Providers>)
    await screen.findByText('R$ 3.500,00')

    userService.profile.mockResolvedValue({ id: 1, fullName: 'Ana', monthlyCeiling: 5000, onboardingCompleted: true })
    fireEvent.click(screen.getByRole('button', { name: /editar teto mensal/i }))
    fireEvent.change(screen.getByLabelText(/novo teto mensal/i), { target: { value: '500000' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar teto/i }))

    await waitFor(() => expect(userService.updatePreferences).toHaveBeenCalledWith({ monthlyCeiling: 5000 }))
    expect(await screen.findByText('60% do teto utilizado')).toBeInTheDocument()
    expect(screen.getByText('Saudável')).toBeInTheDocument()
  })

  it('recarrega o consumo na tela de gastos quando um lancamento e registrado', async () => {
    dashboardService.overview.mockResolvedValue({ income: 0, expense: 1750, balance: -1750 })
    transactionService.list.mockResolvedValue({ data: { items: [], meta: { totalItems: 0 } } })
    categoryService.list.mockResolvedValue([])
    reportService.byCategory.mockResolvedValue([])
    render(
      <Providers>
        <NotifyButton />
        <TransactionsScreen />
      </Providers>,
    )
    expect(await screen.findByText('50% do teto utilizado')).toBeInTheDocument()

    dashboardService.overview.mockResolvedValue({ income: 0, expense: 3500, balance: -3500 })
    fireEvent.click(screen.getByRole('button', { name: /simular novo lançamento/i }))

    expect(await screen.findByText('100% do teto utilizado')).toBeInTheDocument()
    expect(screen.getByText('Limite atingido')).toBeInTheDocument()
  })
})
