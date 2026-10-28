import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { userService } from '../services'
import { AuthProvider, useAuth } from '../context/AuthContext'

vi.mock('../services', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    userService: {
      ...original.userService,
      profile: vi.fn(),
    },
  }
})

function Probe() {
  const { isAuthenticated, initialized } = useAuth()
  return (
    <div>
      <span data-testid="initialized">{String(initialized)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
    </div>
  )
}

function renderWithProbe() {
  return render(
    <MemoryRouter initialEntries={['/rota-protegida']}>
      <AuthProvider>
        <Routes>
          <Route path="/rota-protegida" element={<Probe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AuthProvider (guarda de sessão)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('mantem sessao quando o token e valido', async () => {
    localStorage.setItem('conekta_token', 'token-valido')
    userService.profile.mockResolvedValue({ id: 7, email: 'demo@conektafinance.com' })

    const { getByTestId } = renderWithProbe()

    await waitFor(() => expect(getByTestId('initialized')).toHaveTextContent('true'))
    expect(getByTestId('authenticated')).toHaveTextContent('true')
  })

  it('encerra a sessao quando o token expira (401)', async () => {
    localStorage.setItem('conekta_token', 'token-expirado')
    userService.profile.mockRejectedValue(Object.assign(new Error('Sessão inválida'), { status: 401 }))

    const { getByTestId } = renderWithProbe()

    await waitFor(() => expect(getByTestId('initialized')).toHaveTextContent('true'))
    expect(getByTestId('authenticated')).toHaveTextContent('false')
    expect(localStorage.getItem('conekta_token')).toBeNull()
  })

  it('restaura sessao temporaria salva no sessionStorage', async () => {
    sessionStorage.setItem('conekta_token', 'token-de-aba')
    userService.profile.mockResolvedValue({ id: 8, email: 'temp@conektafinance.com' })

    const { getByTestId } = renderWithProbe()

    await waitFor(() => expect(getByTestId('authenticated')).toHaveTextContent('true'))
  })

  it('inicia desautenticado sem token armazenado', async () => {
    const { getByTestId } = renderWithProbe()

    await waitFor(() => expect(getByTestId('initialized')).toHaveTextContent('true'))
    expect(getByTestId('authenticated')).toHaveTextContent('false')
    expect(userService.profile).not.toHaveBeenCalled()
  })
})
