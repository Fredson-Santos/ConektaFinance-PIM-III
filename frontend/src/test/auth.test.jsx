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
      login: vi.fn(),
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
    authService.requestOtp.mockResolvedValue({ resendAllowedInSeconds: 45, devCode: '849201' })
    authService.verifyOtp.mockResolvedValue({ token: 'token', user: { id: 1, email: 'a@b.c' } })
    authService.demoLogin.mockResolvedValue({ token: 'token', user: { id: 2 } })
    authService.login.mockResolvedValue({ token: 'token', user: { id: 3 } })
    userService.profile.mockResolvedValue({ id: 1, email: 'a@b.c' })
  })

  it('renderiza abas de whatsapp e e-mail', () => {
    renderAuth()
    expect(screen.getByRole('tab', { name: /whatsapp/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /e-mail/i })).toBeInTheDocument()
  })

  it('solicita otp e avanca para o passo do codigo', async () => {
    renderAuth()
    const input = screen.getByLabelText('Número do WhatsApp')
    fireEvent.change(input, { target: { value: '(11) 98765-4321' } })
    fireEvent.click(screen.getByRole('button', { name: /receber código no whatsapp/i }))

    await waitFor(() => expect(authService.requestOtp).toHaveBeenCalledWith('11987654321'))
    expect(await screen.findByText(/Enviado para/i)).toBeInTheDocument()
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
    await screen.findByText(/Enviado para/i)
    fireEvent.click(screen.getByRole('button', { name: /preencher código de demonstração/i }))

    await waitFor(() => expect(authService.verifyOtp).toHaveBeenCalledWith('11987654321', '849201'))
  })

  it('entra pelo formulario de e-mail', async () => {
    renderAuth()
    fireEvent.click(screen.getByRole('tab', { name: /e-mail/i }))
    fireEvent.change(screen.getByPlaceholderText('voce@email.com'), { target: { value: 'teste@conekta.com' } })
    fireEvent.change(screen.getByPlaceholderText('Sua senha'), { target: { value: 'SenhaForte@123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith('teste@conekta.com', 'SenhaForte@123'))
  })

  it('usa o acesso rapido de demonstracao', async () => {
    renderAuth()
    fireEvent.click(screen.getByRole('button', { name: /acesso rápido/i }))

    await waitFor(() => expect(authService.demoLogin).toHaveBeenCalled())
  })
})
