import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotificationsPopover } from '../components/layout/NotificationsPopover'
import { AiPanel } from '../components/ai/AiPanel'
import { alertService, copilotService } from '../services'
import { UiProvider, useUi } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    alertService: {
      ...original.alertService,
      list: vi.fn(),
      unreadCount: vi.fn(),
      markRead: vi.fn(),
      dismiss: vi.fn(),
    },
    copilotService: {
      ...original.copilotService,
      history: vi.fn(),
      sendMessage: vi.fn(),
      confirm: vi.fn(),
      clearHistory: vi.fn(),
    },
    userService: {
      ...original.userService,
      profile: vi.fn(),
    },
  }
})

function OverlayOpener({ overlay }) {
  const { openOverlay } = useUi()
  useEffect(() => {
    openOverlay(overlay)
  }, [openOverlay, overlay])
  return null
}

function renderWithOverlay(overlay, Component) {
  return render(
    <MemoryRouter>
      <UiProvider>
        <ToastProvider>
          <OverlayOpener overlay={overlay} />
          <Component />
        </ToastProvider>
      </UiProvider>
    </MemoryRouter>,
  )
}

describe('NotificationsPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    alertService.list.mockResolvedValue([
      {
        id: 1,
        type: 'budgetExceeded',
        title: 'Lazer acima do limite',
        message: 'Orçamento excedido em R$ 29,90.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ])
    alertService.unreadCount.mockResolvedValue({ count: 1 })
  })

  it('lista alertas ativos e dispensa ao clicar', async () => {
    renderWithOverlay('notif', NotificationsPopover)

    expect(await screen.findByText('Lazer acima do limite')).toBeInTheDocument()
    expect(screen.getByText('Orçamento excedido em R$ 29,90.')).toBeInTheDocument()
    expect(screen.getByText('1 ativos')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dispensar/i }))
    await waitFor(() => expect(alertService.dismiss).toHaveBeenCalledWith(1))
  })

  it('mostra estado vazio quando nao ha alertas', async () => {
    alertService.list.mockResolvedValue([])
    renderWithOverlay('notif', NotificationsPopover)

    expect(await screen.findByText(/nenhum alerta ativo/i)).toBeInTheDocument()
  })
})

describe('AiPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    copilotService.history.mockResolvedValue({ items: [] })
    copilotService.sendMessage.mockResolvedValue({
      userMessage: { id: 10, role: 'user', content: 'Registrar gasto', createdAt: new Date().toISOString() },
      assistantMessage: {
        id: 11,
        role: 'assistant',
        content: 'Posso registrar esse gasto para você.',
        actions: [
          { tool: 'open_transaction_sheet', args: { type: 'expense', value: 45, categoryName: 'Transporte', description: 'Uber' } },
        ],
        createdAt: new Date().toISOString(),
      },
    })
  })

  it('sugere perguntas iniciais e envia mensagem com acao', async () => {
    renderWithOverlay('ai', AiPanel)

    expect(await screen.findByText('Resumo detalhado do mês')).toBeInTheDocument()
    expect(screen.getByText('Onde posso economizar?')).toBeInTheDocument()

    const input = screen.getByLabelText('Mensagem para o assistente')
    fireEvent.change(input, { target: { value: 'Registrar gasto de R$ 45 no uber' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(copilotService.sendMessage).toHaveBeenCalledWith('Registrar gasto de R$ 45 no uber', null))
    expect(await screen.findByText('Abrir lançamento pré-preenchido')).toBeInTheDocument()
  })

  it('confirma rascunho da ia e marca a acao como consumida', async () => {
    copilotService.sendMessage.mockResolvedValue({
      userMessage: { id: 10, role: 'user', content: 'foto da nota', createdAt: new Date().toISOString() },
      assistantMessage: {
        id: 11,
        role: 'assistant',
        content: 'Encontrei na nota: R$ 45,90. Confirma o lançamento?',
        actions: [
          { tool: 'draft_transaction', args: { type: 'expense', value: 45.9, description: 'Ifood' }, status: 'pending' },
        ],
        createdAt: new Date().toISOString(),
      },
    })
    copilotService.confirm.mockResolvedValue({
      id: 12,
      role: 'assistant',
      content: 'Lançamento registrado com sucesso: Ifood de R$ 45,90 em Alimentação.',
      createdAt: new Date().toISOString(),
    })
    renderWithOverlay('ai', AiPanel)

    const input = screen.getByLabelText('Mensagem para o assistente')
    fireEvent.change(input, { target: { value: 'foto da nota' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    fireEvent.click(await screen.findByRole('button', { name: /confirmar lançamento/i }))

    await waitFor(() => expect(copilotService.confirm).toHaveBeenCalledWith(11))
    expect(await screen.findByText(/Ifood de R\$ 45,90 em Alimentação/i)).toBeInTheDocument()
    expect(screen.getByText(/lançamento confirmado/i)).toBeInTheDocument()
  })

  it('rejeita anexo de formato nao suportado', async () => {
    const { container } = renderWithOverlay('ai', AiPanel)

    const fileInput = container.querySelector('input[type="file"]')
    fireEvent.change(fileInput, {
      target: { files: [new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByText(/Formatos aceitos: JPEG, PNG ou WebP\./)).toBeInTheDocument()
  })

  it('anexa nota fiscal e envia imagem junto com a mensagem', async () => {
    const { container } = renderWithOverlay('ai', AiPanel)

    const fileInput = container.querySelector('input[type="file"]')
    fireEvent.change(fileInput, {
      target: { files: [new File(['conteudo'], 'nota.png', { type: 'image/png' })] },
    })

    expect(await screen.findByAltText('Nota fiscal selecionada')).toBeInTheDocument()

    const input = screen.getByLabelText('Mensagem para o assistente')
    fireEvent.change(input, { target: { value: 'lê essa nota' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() =>
      expect(copilotService.sendMessage).toHaveBeenCalledWith('lê essa nota', expect.stringMatching(/^data:/)),
    )
  })

  it('exibe mensagem de erro quando a cota falha', async () => {
    copilotService.sendMessage.mockRejectedValue(
      Object.assign(new Error('Você atingiu o limite de mensagens do assistente por hoje. Volte amanhã.'), { status: 429 }),
    )
    renderWithOverlay('ai', AiPanel)

    const input = await screen.findByLabelText('Mensagem para o assistente')
    fireEvent.change(input, { target: { value: 'mais uma' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText(/limite de mensagens/i)).toBeInTheDocument()
  })
})
