import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsScreen } from '../views/settings/SettingsScreen'
import { ImportSheet } from '../components/import/ImportSheet'
import { userService, importService, reportService } from '../services'
import { UiProvider, useUi } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'
import { useEffect } from 'react'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    userService: {
      ...original.userService,
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      updatePreferences: vi.fn(),
      resetData: vi.fn(),
      deleteAccount: vi.fn(),
      uploadAvatar: vi.fn(),
      profile: vi.fn(),
    },
    importService: {
      ...original.importService,
      preview: vi.fn(),
      confirm: vi.fn(),
    },
    reportService: {
      ...original.reportService,
      byCategory: vi.fn().mockResolvedValue([]),
      daily: vi.fn().mockResolvedValue([]),
      exportCsv: vi.fn(),
      exportJson: vi.fn(),
    },
  }
})

const USER = {
  id: 1,
  fullName: 'Fredson Santos',
  displayName: 'Fred',
  email: 'fred@conekta.com',
  phone: '11987654321',
  cpf: '12345678900',
  occupation: 'Desenvolvedor',
  monthlyCeiling: 6350,
  currency: 'BRL',
  cycleStartDay: 1,
}

function OverlayOpener({ overlay }) {
  const { openOverlay } = useUi()
  useEffect(() => {
    openOverlay(overlay)
  }, [openOverlay, overlay])
  return null
}

function renderSettings(tab) {
  return render(
    <MemoryRouter initialEntries={[`/configuracoes${tab ? `?tab=${tab}` : ''}`]}>
      <AuthProvider>
        <UiProvider>
          <ToastProvider>
            <SettingsScreen />
          </ToastProvider>
        </UiProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('conekta_token', 'token-teste')
    userService.profile.mockResolvedValue(USER)
    userService.updateProfile.mockResolvedValue(USER)
    userService.updatePreferences.mockResolvedValue({ monthlyCeiling: 8380, currency: 'BRL', cycleStartDay: 5 })
    userService.changePassword.mockResolvedValue(null)
    userService.resetData.mockResolvedValue(null)
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('salva dados pessoais do perfil', async () => {
    renderSettings()
    const fullName = await screen.findByDisplayValue('Fredson Santos')
    fireEvent.change(fullName, { target: { value: 'Fredson S. Santos' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() =>
      expect(userService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Fredson S. Santos' }),
      ),
    )
  })

  it('atualiza teto geral e dia do ciclo', async () => {
    renderSettings()
    await screen.findByDisplayValue('6350')
    fireEvent.change(screen.getByLabelText(/teto orçamentário/i), { target: { value: '8380' } })
    fireEvent.click(screen.getByRole('button', { name: /atualizar metas/i }))

    await waitFor(() =>
      expect(userService.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ monthlyCeiling: 8380 }),
      ),
    )
  })

  it('troca senha com validacao de confirmacao', async () => {
    userService.changePassword.mockResolvedValue(null)
    renderSettings('senha')

    fireEvent.change(await screen.findByLabelText('Senha atual'), { target: { value: 'SenhaAtual@123' } })
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'NovaSenha@456' } })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'Diferente@999' } })
    fireEvent.click(screen.getByRole('button', { name: /atualizar senha/i }))

    expect(await screen.findByText(/confirmação não confere/i)).toBeInTheDocument()
    expect(userService.changePassword).not.toHaveBeenCalled()
  })

  it('alterna modo discreto na aba de privacidade', async () => {
    renderSettings('privacidade')

    const toggle = await screen.findByRole('switch', { name: 'Modo discreto' })
    fireEvent.click(toggle)
    expect(localStorage.getItem('conekta_discreet')).toBe('true')
    fireEvent.click(toggle)
    expect(localStorage.getItem('conekta_discreet')).toBe('false')
  })

  it('redefine registros financeiros com confirmacao', async () => {
    renderSettings('privacidade')

    fireEvent.click(await screen.findByRole('button', { name: /^redefinir$/i }))
    fireEvent.click(await screen.findByRole('button', { name: /sim, redefinir/i }))

    await waitFor(() => expect(userService.resetData).toHaveBeenCalled())
  })

  it('exige senha para excluir a conta', async () => {
    userService.deleteAccount.mockResolvedValue(null)
    renderSettings('privacidade')

    fireEvent.click(await screen.findByRole('button', { name: /excluir conta/i }))
    const deleteButton = await screen.findByRole('button', { name: /excluir definitivamente/i })
    expect(deleteButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Sua senha'), { target: { value: 'SenhaForte@123' } })
    expect(deleteButton).toBeEnabled()
    fireEvent.click(deleteButton)

    await waitFor(() => expect(userService.deleteAccount).toHaveBeenCalledWith('SenhaForte@123'))
  })
})

describe('ImportSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    importService.preview.mockResolvedValue({
      batchId: 7,
      fileName: 'extrato.csv',
      autoCategorize: true,
      ignoreDuplicates: true,
      items: [
        { index: 0, date: new Date().toISOString(), description: 'Uber corrida', amount: 32.9, type: 'expense', suggestedCategory: { id: 2, name: 'Transporte' }, isDuplicate: false },
        { index: 1, date: new Date().toISOString(), description: 'Salário', amount: 5200, type: 'income', suggestedCategory: null, isDuplicate: true },
      ],
    })
    importService.confirm.mockResolvedValue({ importedCount: 2, skippedDuplicates: 0 })
  })

  it('preve lancamentos do arquivo e confirma a importacao', async () => {
    const { container } = render(
      <MemoryRouter>
        <UiProvider>
          <ToastProvider>
            <OverlayOpener overlay="import" />
            <ImportSheet />
          </ToastProvider>
        </UiProvider>
      </MemoryRouter>,
    )

    const file = new File(['Data;Descricao;Valor'], 'extrato.csv', { type: 'text/csv' })
    const fileInput = container.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(importService.preview).toHaveBeenCalledWith(file))
    expect(await screen.findByText('Uber corrida')).toBeInTheDocument()
    expect(screen.getByText(/detectado\(s\)/i)).toBeInTheDocument()
    expect(screen.getByText('Duplicado')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^importar 2/i }))
    await waitFor(() =>
      expect(importService.confirm).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ itemIds: [0, 1], autoCategorize: true, ignoreDuplicates: true }),
      ),
    )
  })
})
