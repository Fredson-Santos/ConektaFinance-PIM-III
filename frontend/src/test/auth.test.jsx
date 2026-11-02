import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthScreen } from '../views/auth/AuthScreen'
import { authService, userService } from '../services'
import { UiProvider } from '../context/UiContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    authService: {
      ...original.authService,
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      demoLogin: vi.fn(),
    },
    userService: {
      ...original.userService,
      profile: vi.fn(),
    },
  }
})

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <UiProvider>
          <ToastProvider>
            <AuthScreen />
          </ToastProvider>
        </UiProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    authService.requestOtp.mockResolvedValue({ resendAllowedInSeconds: 45, devCode: '849201' })
    authService.verifyOtp.mockResolvedValue({ token: 'token', user: { id: 1, email: 'a@b.c' } })
    authService.demoLogin.mockResolvedValue({ token: 'token', user: { id: 2 } })
    userService.profile.mockResolvedValue({ id: 1, email: 'a@b.c' })
  })

  it('exibe apenas o fluxo por whatsapp, sem campos de e-mail ou senha', () => {
    renderAuth()
    expect(screen.getByRole('heading', { name: /acesse sua conta/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Número do WhatsApp')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('voce@email.com')).not.toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeNull()
    expect(screen.getByRole('checkbox', { name: /lembrar de mim/i })).toBeChecked()
  })

  it('solicita otp e avanca para o passo do codigo', async () => {
    renderAuth()
    const input = screen.getByLabelText('Número do WhatsApp')
    fireEvent.change(input, { target: { value: '(11) 98765-4321' } })
    fireEvent.click(screen.getByRole('button', { name: /receber código no whatsapp/i }))

    await waitFor(() => expect(authService.requestOtp).toHaveBeenCalledWith('11987654321'))
    expect(await screen.findByText(/Enviamos um código/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preencher código de demonstração/i })).toBeInTheDocument()
  })

  it('valida telefone incompleto sem chamar a api', async () => {
    renderAuth()
    fireEvent.change(screen.getByLabelText('Número do WhatsApp'), { target: { value: '(11) 9876' } })
    fireEvent.click(screen.getByRole('button', { name: /receber código no whatsapp/i }))
    expect(authService.requestOtp).not.toHaveBeenCalled()
    expect(await screen.findByText(/informe o ddd/i)).toBeInTheDocument()
  })

  it('verifica o otp e autentica o usuario', async () => {
    renderAuth()
    fireEvent.change(screen.getByLabelText('Número do WhatsApp'), { target: { value: '(11) 98765-4321' } })
    fireEvent.click(screen.getByRole('button', { name: /receber código no whatsapp/i }))
    await screen.findByText(/Enviamos um código/i)
    fireEvent.click(screen.getByRole('button', { name: /preencher código de demonstração/i }))

    await waitFor(() => expect(authService.verifyOtp).toHaveBeenCalledWith('11987654321', '849201'))
  })

  it('persiste a sessao no localStorage quando lembrar de mim esta marcado', async () => {
    renderAuth()
    fireEvent.change(screen.getByLabelText('Número do WhatsApp'), { target: { value: '(11) 98765-4321' } })
    fireEvent.click(screen.getByRole('button', { name: /receber código no whatsapp/i }))
    await screen.findByText(/Enviamos um código/i)
    fireEvent.click(screen.getByRole('button', { name: /preencher código de demonstração/i }))

    await waitFor(() => expect(localStorage.getItem('conekta_token')).toBe('token'))
    expect(sessionStorage.getItem('conekta_token')).toBeNull()
  })

  it('usa sessionStorage quando lembrar de mim esta desmarcado', async () => {
    renderAuth()
    fireEvent.click(screen.getByRole('checkbox', { name: /lembrar de mim/i }))
    fireEvent.change(screen.getByLabelText('Número do WhatsApp'), { target: { value: '(11) 98765-4321' } })
    fireEvent.click(screen.getByRole('button', { name: /receber código no whatsapp/i }))
    await screen.findByText(/Enviamos um código/i)
    fireEvent.click(screen.getByRole('button', { name: /preencher código de demonstração/i }))

    await waitFor(() => expect(sessionStorage.getItem('conekta_token')).toBe('token'))
    expect(localStorage.getItem('conekta_token')).toBeNull()
  })

  it('volta para o passo do telefone ao alterar o numero', async () => {
    renderAuth()
    fireEvent.change(screen.getByLabelText('Número do WhatsApp'), { target: { value: '(11) 98765-4321' } })
    fireEvent.click(screen.getByRole('button', { name: /receber código no whatsapp/i }))
    await screen.findByText(/Enviamos um código/i)
    fireEvent.click(screen.getByRole('button', { name: /alterar número/i }))

    expect(screen.getByLabelText('Número do WhatsApp')).toHaveValue('(11) 98765-4321')
  })

  it('usa o acesso rapido de demonstracao', async () => {
    renderAuth()
    fireEvent.click(screen.getByRole('button', { name: /conta de demonstração/i }))

    await waitFor(() => expect(authService.demoLogin).toHaveBeenCalled())
  })
})
