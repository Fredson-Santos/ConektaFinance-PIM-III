import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../routes/AppRoutes'
import { Sidebar } from '../components/layout/Sidebar'
import { adminService, userService } from '../services'
import { AuthProvider } from '../context/AuthContext'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'
import { ThemeProvider } from '../context/ThemeContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    userService: { ...original.userService, profile: vi.fn() },
    adminService: { metrics: vi.fn(), users: vi.fn(), updateStatus: vi.fn() },
  }
})

vi.mock('../components/layout/AppLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { AppLayout: () => <Outlet /> }
})

vi.mock('../views/dashboard/DashboardScreen', () => ({
  DashboardScreen: () => <h1>Painel principal</h1>,
}))

const admin = { id: 1, fullName: 'Admin Conekta', accountType: 'Admin', onboardingCompleted: true }
const standard = { id: 2, fullName: 'Ana Souza', accountType: 'Standard', onboardingCompleted: true }
const listedUser = {
  id: 7,
  fullName: 'Bruno Lima',
  email: 'bruno@exemplo.com',
  phone: '11988887777',
  accountType: 'Standard',
  isActive: true,
  onboardingCompleted: true,
  createdAt: '2026-10-01T12:00:00',
  transactionCount: 12,
  lastActivityAt: '2026-10-20T12:00:00',
}

function renderWithProviders(ui, path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <AuthProvider>
          <UiProvider>
            <ToastProvider>{ui}</ToastProvider>
          </UiProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('Painel administrativo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('conekta_token', 'token')
    adminService.metrics.mockResolvedValue({
      totalUsers: 42,
      activeUsersLast30Days: 30,
      newUsersThisMonth: 5,
      inactiveAccounts: 1,
      transactionsThisMonth: 310,
      alertsThisMonth: 18,
      aiMessagesWebThisMonth: 64,
      aiMessagesWhatsAppThisMonth: 21,
    })
    adminService.users.mockResolvedValue({ items: [listedUser], totalItems: 1, page: 1, pageSize: 10 })
  })

  it('exibe metricas da plataforma e lista de usuarios para o admin', async () => {
    userService.profile.mockResolvedValue(admin)
    renderWithProviders(<AppRoutes />)

    expect(await screen.findByText('Usuários cadastrados')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Perguntas à IA (WhatsApp)')).toBeInTheDocument()
    expect(await screen.findByText('Bruno Lima')).toBeInTheDocument()
    expect(screen.getByText(/bruno@exemplo.com/)).toBeInTheDocument()
    expect(screen.getByText('Ativa')).toBeInTheDocument()
  })

  it('redireciona usuario comum que acessa /admin para o dashboard', async () => {
    userService.profile.mockResolvedValue(standard)
    renderWithProviders(<AppRoutes />)

    expect(await screen.findByRole('heading', { name: /painel principal/i })).toBeInTheDocument()
    expect(adminService.metrics).not.toHaveBeenCalled()
  })

  it('desativa conta apos confirmacao e atualiza a linha', async () => {
    userService.profile.mockResolvedValue(admin)
    adminService.updateStatus.mockResolvedValue({ ...listedUser, isActive: false })
    renderWithProviders(<AppRoutes />)

    fireEvent.click(await screen.findByRole('button', { name: /desativar conta de bruno lima/i }))
    const dialog = await screen.findByRole('dialog', { name: /desativar conta/i })
    fireEvent.click(within(dialog).getByRole('button', { name: /desativar conta/i }))

    await waitFor(() => expect(adminService.updateStatus).toHaveBeenCalledWith(7, false))
    expect(await screen.findByText('Desativada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reativar conta de bruno lima/i })).toBeInTheDocument()
  })

  it('busca usuarios pelo texto digitado', async () => {
    userService.profile.mockResolvedValue(admin)
    renderWithProviders(<AppRoutes />)

    fireEvent.change(await screen.findByLabelText('Buscar usuários'), { target: { value: 'bruno' } })

    await waitFor(() =>
      expect(adminService.users).toHaveBeenLastCalledWith({ search: 'bruno', page: 1, pageSize: 10 }),
    )
  })

  it('mostra o item Administração no menu apenas para admin', async () => {
    userService.profile.mockResolvedValue(admin)
    const { unmount } = renderWithProviders(<Sidebar />, '/dashboard')
    expect(await screen.findByRole('link', { name: /administração/i })).toBeInTheDocument()
    unmount()

    userService.profile.mockResolvedValue(standard)
    renderWithProviders(<Sidebar />, '/dashboard')
    expect(await screen.findByText('Conta pessoal')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /administração/i })).not.toBeInTheDocument()
  })
})
