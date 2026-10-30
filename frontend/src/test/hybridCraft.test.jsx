import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { RuntimeLog } from '../components/common/RuntimeLog'
import { AiFab } from '../components/ai/AiFab'
import { UiProvider } from '../context/UiContext'

describe('RuntimeLog', () => {
  it('renderiza eventos com timestamp mono e badge de status', () => {
    render(
      <RuntimeLog
        title="Monitor de orçamento"
        live
        entries={[
          { id: 'a', time: '22:42', level: 'success', message: 'Moradia dentro do teto' },
          { id: 'b', time: '22:43', level: 'destructive', message: 'Lazer ultrapassou o teto' },
          { id: 'c', time: '22:44', level: 'dispatch', label: 'DÉBITO', message: 'Mercado' },
        ]}
      />,
    )
    const log = screen.getByRole('region', { name: 'Monitor de orçamento' })
    expect(within(log).getByText('ao vivo')).toBeInTheDocument()
    expect(within(log).getByText('[22:42]').className).toContain('runtime-log-time')
    expect(within(log).getByText('NOMINAL').className).toContain('success')
    expect(within(log).getByText('LIMITE').className).toContain('destructive')
    expect(within(log).getByText('DÉBITO').className).toContain('dispatch')
  })

  it('exibe mensagem vazia quando não há eventos', () => {
    render(<RuntimeLog title="Log" entries={[]} emptyMessage="Sem eventos" />)
    expect(screen.getByText('Sem eventos')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('AiFab', () => {
  it('fica fixo e abre o assistente com um clique', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    render(
      <UiProvider>
        <AiFab />
      </UiProvider>,
    )
    const fab = screen.getByRole('button', { name: 'Abrir assistente de IA' })
    fireEvent.pointerDown(fab, { clientX: 10, clientY: 10 })
    fireEvent.pointerMove(fab, { clientX: 200, clientY: 200 })
    expect(fab.style.left).toBe('')
    expect(fab.style.top).toBe('')
    fireEvent.click(fab)
    expect(fab.style.display).toBe('none')
  })
})
