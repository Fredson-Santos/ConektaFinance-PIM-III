import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BudgetsScreen } from '../views/budgets/BudgetsScreen'
import { TransactionsScreen } from '../views/transactions/TransactionsScreen'
import { categoryService, budgetService, transactionService, reportService } from '../services'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    categoryService: {
      ...original.categoryService,
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    budgetService: {
      ...original.budgetService,
      list: vi.fn(),
      upsert: vi.fn(),
    },
    transactionService: {
      ...original.transactionService,
      list: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      create: vi.fn(),
    },
    reportService: {
      ...original.reportService,
      byCategory: vi.fn(),
    },
  }
})

const EXPENSE_CATEGORIES = [
  { id: 1, name: 'Alimentação', kind: 'expense', colorCode: '#ef4444', icon: 'Utensils', spent: 980, limit: 1500, status: 'ok' },
  { id: 2, name: 'Lazer', kind: 'expense', colorCode: '#00cc88', icon: 'Film', spent: 310, limit: 250, status: 'over' },
  { id: 3, name: 'Educação', kind: 'expense', colorCode: '#8e4ec6', icon: 'GraduationCap', spent: 0, limit: 0, status: 'noLimit' },
]

function renderScreen(Screen) {
  return render(
    <MemoryRouter>
      <UiProvider>
        <ToastProvider>
          <Screen />
        </ToastProvider>
      </UiProvider>
    </MemoryRouter>,
  )
}

describe('BudgetsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    categoryService.list.mockResolvedValue(EXPENSE_CATEGORIES)
    budgetService.list.mockResolvedValue([])
  })

  it('exibe cards por categoria com status de teto', async () => {
    renderScreen(BudgetsScreen)

    expect(await screen.findByText('Alimentação')).toBeInTheDocument()
    expect(screen.getByText('Estourado')).toBeInTheDocument()
    expect(screen.getByText('Sob controle')).toBeInTheDocument()
    expect(screen.getByText('Disponível: R$ 520,00')).toBeInTheDocument()
    expect(screen.getByText(/Excesso de R\$ 60,00/i)).toBeInTheDocument()
  })

  it('abre modal de definicao de teto para categoria sem limite', async () => {
    renderScreen(BudgetsScreen)

    await screen.findByText('Educação')
    fireEvent.click(screen.getByRole('button', { name: /definir teto/i }))
    expect(await screen.findByText(/Definir teto · Educação/i)).toBeInTheDocument()
  })

  it('cria nova categoria pelo modal', async () => {
    categoryService.create.mockResolvedValue({ id: 9 })
    renderScreen(BudgetsScreen)

    fireEvent.click(screen.getByRole('button', { name: /nova categoria/i }))
    fireEvent.change(await screen.findByPlaceholderText('Ex.: Pets'), { target: { value: 'Pets' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar categoria' }))

    await waitFor(() =>
      expect(categoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Pets', kind: 'expense' }),
      ),
    )
  })

  it('exibe conflito de nome duplicado', async () => {
    categoryService.create.mockRejectedValue(
      Object.assign(new Error('Já existe uma categoria com este nome.'), { status: 409 }),
    )
    renderScreen(BudgetsScreen)

    fireEvent.click(screen.getByRole('button', { name: /nova categoria/i }))
    fireEvent.change(await screen.findByPlaceholderText('Ex.: Pets'), { target: { value: 'Lazer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar categoria' }))

    await waitFor(() => expect(screen.getByText('Já existe uma categoria com este nome.')).toBeInTheDocument())
  })
})

describe('TransactionsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const headers = { get: (name) => (name === 'X-Total-Sum' ? '260.00' : null) }
    transactionService.list.mockResolvedValue({
      data: {
        items: [
          {
            id: 1,
            type: 'expense',
            description: 'Mercado Pão de Açúcar',
            value: 186.4,
            transactionDate: new Date().toISOString(),
            paymentMethod: 'cartao',
            category: { id: 1, name: 'Alimentação', colorCode: '#ef4444', icon: 'Utensils' },
          },
          {
            id: 2,
            type: 'income',
            description: 'Salário',
            value: 5200,
            transactionDate: new Date().toISOString(),
            paymentMethod: 'transferencia',
            category: { id: 8, name: 'Salário', colorCode: '#00cc88', icon: 'Wallet' },
          },
        ],
        meta: { totalItems: 2, totalPages: 1, page: 1, pageSize: 100 },
      },
      headers,
    })
    categoryService.list.mockResolvedValue(EXPENSE_CATEGORIES)
    budgetService.list.mockResolvedValue([])
    reportService.byCategory.mockResolvedValue([])
  })

  it('agrupa lancamentos por dia com soma e total do cabecalho', async () => {
    renderScreen(TransactionsScreen)

    expect(await screen.findByText('Mercado Pão de Açúcar')).toBeInTheDocument()
    expect(screen.getByText('Hoje')).toBeInTheDocument()
    expect(screen.getByText('Salário')).toBeInTheDocument()
    expect(screen.getByText('R$ 260,00')).toBeInTheDocument()
    expect(screen.getByText('2 lançamentos')).toBeInTheDocument()
  })

  it('filtra por categoria ao clicar no chip', async () => {
    renderScreen(TransactionsScreen)

    fireEvent.click(await screen.findByRole('button', { name: /alimentação/i }))
    await waitFor(() =>
      expect(transactionService.list).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: '1' }),
      ),
    )
  })

  it('mostra estado vazio quando nao ha lancamentos', async () => {
    transactionService.list.mockResolvedValue({
      data: { items: [], meta: { totalItems: 0, totalPages: 0, page: 1, pageSize: 100 } },
      headers: { get: () => null },
    })
    renderScreen(TransactionsScreen)

    expect(await screen.findByText('Nenhuma transação encontrada')).toBeInTheDocument()
  })

  it('exibe estado zerado e vazio na coluna lateral quando nao ha orcamentos e maiores categorias', async () => {
    budgetService.list.mockResolvedValue([])
    reportService.byCategory.mockResolvedValue([])
    renderScreen(TransactionsScreen)

    expect(await screen.findByText('Sem teto')).toBeInTheDocument()
    expect(screen.getByText('Meta: Não definida')).toBeInTheDocument()
    expect(screen.getByText('Sem gastos registrados no período')).toBeInTheDocument()
  })
})
