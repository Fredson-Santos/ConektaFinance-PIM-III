import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../routes/AppRoutes'
import { categoryService, userService } from '../services'
import { AuthProvider } from '../context/AuthContext'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    userService: { ...original.userService, profile: vi.fn(), completeOnboarding: vi.fn() },
    categoryService: { ...original.categoryService, list: vi.fn() },
  }
})

vi.mock('../components/layout/AppLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { AppLayout: () => <Outlet /> }
})

vi.mock('../views/dashboard/DashboardScreen', () => ({
  DashboardScreen: () => <h1>Painel principal</h1>,
}))

const pendingUser = { id: 9, fullName: 'Contato 11987654321', monthlyCeiling: 0, onboardingCompleted: false }

function renderApp(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <UiProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </UiProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('conekta_token', 'token')
    categoryService.list.mockResolvedValue([
      { id: 1, name: 'Alimentação', icon: 'Utensils', colorCode: '#ef4444' },
      { id: 2, name: 'Transporte', icon: 'Car', colorCode: '#0070f3' },
    ])
  })

  it('direciona o primeiro acesso para o onboarding sem nome provisorio', async () => {
    userService.profile.mockResolvedValue(pendingUser)
    renderApp()

    expect(await screen.findByRole('heading', { name: /como podemos te chamar/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveValue('')
  })

  it('nao intercepta usuarios com cadastro completo', async () => {
    userService.profile.mockResolvedValue({ ...pendingUser, fullName: 'Ana', onboardingCompleted: true })
    renderApp('/boas-vindas')

    expect(await screen.findByRole('heading', { name: /painel principal/i })).toBeInTheDocument()
  })

  it('valida nome e teto antes de avancar', async () => {
    userService.profile.mockResolvedValue(pendingUser)
    renderApp()

    fireEvent.click(await screen.findByRole('button', { name: /continuar/i }))
    expect(await screen.findByText(/informe seu nome/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Maria Oliveira' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    fireEvent.click(await screen.findByRole('button', { name: /continuar/i }))
    expect(await screen.findByText(/defina um teto mensal/i)).toBeInTheDocument()
  })

  it('aplica mascara monetaria no valor personalizado', async () => {
    userService.profile.mockResolvedValue(pendingUser)
    renderApp()

    fireEvent.change(await screen.findByLabelText('Nome completo'), { target: { value: 'Maria Oliveira' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    fireEvent.change(await screen.findByLabelText('Teto mensal'), { target: { value: '425050' } })

    expect(screen.getByLabelText('Teto mensal')).toHaveValue('4.250,50')
    expect(screen.getByRole('radio', { name: /personalizado/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('persiste os dados na api e redireciona ao dashboard', async () => {
    userService.profile.mockResolvedValue(pendingUser)
    userService.completeOnboarding.mockResolvedValue({
      ...pendingUser,
      fullName: 'Maria Oliveira',
      monthlyCeiling: 3500,
      onboardingCompleted: true,
    })
    renderApp()

    fireEvent.change(await screen.findByLabelText('Nome completo'), { target: { value: 'Maria Oliveira' } })
    fireEvent.change(screen.getByLabelText(/nome de preferência/i), { target: { value: 'Mari' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    fireEvent.click(await screen.findByRole('radio', { name: 'R$ 3.500' }))
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(await screen.findByRole('heading', { name: /tudo pronto, mari/i })).toBeInTheDocument()
    expect(await screen.findByText('Alimentação')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ir para o dashboard/i }))

    await waitFor(() =>
      expect(userService.completeOnboarding).toHaveBeenCalledWith({
        fullName: 'Maria Oliveira',
        displayName: 'Mari',
        monthlyCeiling: 3500,
      }),
    )
    expect(await screen.findByRole('heading', { name: /painel principal/i })).toBeInTheDocument()
  })
})
