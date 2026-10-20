import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CommandPalette } from '../components/cmdk/CommandPalette'
import { UiProvider, useUi } from '../context/UiContext'
import { useEffect } from 'react'

function OverlayOpener({ overlay }) {
  const { openOverlay } = useUi()
  useEffect(() => {
    openOverlay(overlay)
  }, [openOverlay, overlay])
  return null
}

function renderPalette(initiallyOpen = true) {
  const rendered = render(
    <MemoryRouter>
      <UiProvider>
        {initiallyOpen ? <OverlayOpener overlay="cmdk" /> : null}
        <CommandPalette />
      </UiProvider>
    </MemoryRouter>,
  )
  return rendered
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filtra comandos por texto', async () => {
    renderPalette()

    const input = await screen.findByLabelText('Buscar comandos')
    expect(screen.getByText('Ir para Dashboard')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'extrato' } })
    expect(screen.getByText('Importar extrato')).toBeInTheDocument()
    expect(screen.queryByText('Ir para Dashboard')).not.toBeInTheDocument()
  })

  it('mostra estado vazio quando nada corresponde', async () => {
    renderPalette()

    fireEvent.change(await screen.findByLabelText('Buscar comandos'), { target: { value: 'zzzz' } })
    expect(await screen.findByText('Nenhuma ação encontrada')).toBeInTheDocument()
  })

  it('abre a paleta com a tecla de barra fora de inputs', async () => {
    renderPalette(false)

    expect(screen.queryByLabelText('Buscar comandos')).not.toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: '/' })
    expect(await screen.findByLabelText('Buscar comandos')).toBeInTheDocument()
  })

  it('navega com setas e executa com enter', async () => {
    renderPalette()

    const input = await screen.findByLabelText('Buscar comandos')
    fireEvent.change(input, { target: { value: 'gastos' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(screen.queryByLabelText('Buscar comandos')).not.toBeInTheDocument())
  })
})
