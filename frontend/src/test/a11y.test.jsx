import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import { AppRoutes } from '../routes/AppRoutes'
import { AuthProvider } from '../context/AuthContext'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'
import { ThemeProvider } from '../context/ThemeContext'

// Auditoria WCAG 2.1 A/AA automatizada das telas principais (roda no CI).
// Contraste de cores fica fora: o jsdom nao calcula estilos renderizados; ele e
// verificado com axe no navegador real (ver docs/02-planejamento/fases/TASKS_FASE_14.md, F14.10).

const admin = {
  id: 1,
  fullName: 'Admin Conekta',
  displayName: 'Admin',
  email: 'admin@conekta.local',
  accountType: 'Admin',
  monthlyCeiling: 3000,
  onboardingCompleted: true,
}

const category = { id: 1, name: 'Alimentação', kind: 'expense', colorCode: '#ef4444', icon: 'Utensils', spent: 120, limit: 500 }

const RESPONSES = [
  [/\/users\/me\/preferences/, { monthlyCeiling: 3000, currency: 'BRL', cycleStartDay: 1 }],
  [/\/users\/me$/, admin],
  [/\/dashboard\/overview/, { balance: 1200, income: 3000, expense: 1800, expenseToCeilingPercentage: 60, currency: 'BRL' }],
  [/\/dashboard\/weekly-expenses/, { days: [], total: 0 }],
  [/\/dashboard\/(recent-transactions|budget-meters)/, []],
  [/\/reports\/summary/, { totalIncome: 3000, totalExpense: 1800, balance: 1200, savingsRate: 40 }],
  [/\/reports\/(by-category|trend|daily)/, []],
  [/\/alerts\/unread-count/, { count: 0 }],
  [/\/(alerts|insights)/, []],
  [/\/copilot\/history/, { items: [], remainingToday: 30 }],
  [/\/categories/, [category]],
  [/\/budgets/, []],
  [/\/transactions/, { items: [], totalItems: 0, page: 1, pageSize: 20 }],
  [/\/admin\/metrics/, { totalUsers: 3, activeUsersLast30Days: 2, newUsersThisMonth: 1, inactiveAccounts: 0, transactionsThisMonth: 10, alertsThisMonth: 2, aiMessagesWebThisMonth: 4, aiMessagesWhatsAppThisMonth: 1 }],
  [/\/admin\/users/, { items: [{ id: 2, fullName: 'Bruno Lima', email: 'bruno@exemplo.com', phone: null, accountType: 'Standard', isActive: true, onboardingCompleted: true, createdAt: '2026-10-01T12:00:00', transactionCount: 3, lastActivityAt: null }], totalItems: 1, page: 1, pageSize: 10 }],
]

function mockFetch(url) {
  const path = new URL(url, 'http://localhost').pathname
  const match = RESPONSES.find(([pattern]) => pattern.test(path))
  return Promise.resolve(
    new Response(JSON.stringify(match ? match[1] : {}), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Total-Sum': '0' },
    }),
  )
}

async function auditRoute(path, { authenticated = true } = {}) {
  if (authenticated) localStorage.setItem('conekta_token', 'token')
  const { container } = render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <AuthProvider>
          <UiProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </UiProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
  return container
}

async function violations(container) {
  const results = await axe.run(container, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    rules: { 'color-contrast': { enabled: false } },
  })
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

describe('Acessibilidade (axe-core, WCAG 2.1 A/AA)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)
    // jsdom nao implementa matchMedia; simula viewport desktop.
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('tela de login nao tem violacoes', async () => {
    const container = await auditRoute('/login', { authenticated: false })
    await screen.findByRole('heading', { name: /acesse sua conta/i })

    expect(await violations(container)).toEqual([])
  })

  it.each([
    ['/dashboard', /dashboard/i],
    ['/transacoes', /gastos/i],
    ['/categorias', /categorias/i],
    ['/relatorios', /relatórios/i],
    ['/configuracoes', /configurações/i],
    ['/admin', /administração/i],
  ])('tela %s nao tem violacoes', async (path, title) => {
    const container = await auditRoute(path)
    await screen.findByRole('heading', { level: 1, name: title })

    expect(await violations(container)).toEqual([])
  })

  it('oferece link para pular direto ao conteudo principal', async () => {
    await auditRoute('/dashboard')

    const skip = await screen.findByRole('link', { name: /pular para o conteúdo/i })
    expect(skip).toHaveAttribute('href', '#conteudo')
    expect(document.getElementById('conteudo')).toBeInTheDocument()
  })
})
