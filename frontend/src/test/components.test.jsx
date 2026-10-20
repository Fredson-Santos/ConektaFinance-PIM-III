import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Meter } from '../components/common/Meter'
import { OtpBoxes } from '../components/common/OtpBoxes'
import { MoneyText } from '../components/common/MoneyText'
import { UiProvider, useUi } from '../context/UiContext'

describe('Button', () => {
  it('dispara onClick e desabilita durante loading', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Salvar</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<Button onClick={onClick} loading>Salvar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('aplica variante de perigo', () => {
    render(<Button variant="danger">Excluir</Button>)
    expect(screen.getByRole('button', { name: 'Excluir' }).className).toContain('ds-btn-danger')
  })
})

describe('Badge', () => {
  it('renderiza variante de status', () => {
    render(<Badge variant="warn">Em atenção</Badge>)
    expect(screen.getByText('Em atenção').className).toContain('ds-badge-warn')
  })
})

describe('Meter', () => {
  it('calcula percentual relativo ao maximo', () => {
    render(<Meter value={90} max={100} data-testid="meter" />)
    const meter = screen.getByRole('progressbar')
    expect(meter.getAttribute('aria-valuenow')).toBe('90')
  })

  it('limita a barra a 100%', () => {
    render(<Meter value={180} max={100} />)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
  })
})

describe('OtpBoxes', () => {
  it('notifica o codigo completo ao colar', () => {
    const onComplete = vi.fn()
    render(<OtpBoxes onComplete={onComplete} />)
    const first = screen.getByLabelText('Dígito 1')
    fireEvent.paste(first, { clipboardData: { getData: () => '849201' } })
    expect(onComplete).toHaveBeenCalledWith('849201')
  })
})

describe('MoneyText', () => {
  it('formata valores e respeita o modo discreto', () => {
    const { rerender } = render(
      <UiProvider>
        <MoneyText value={123.45} />
      </UiProvider>,
    )
    expect(screen.getByText('R$ 123,45')).toBeInTheDocument()

    function DiscreetHarness() {
      const { toggleDiscreet } = useUi()
      return (
        <>
          <button type="button" onClick={toggleDiscreet}>alternar</button>
          <MoneyText value={123.45} />
        </>
      )
    }

    rerender(
      <UiProvider>
        <DiscreetHarness />
      </UiProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'alternar' }))
    expect(screen.getByText('R$ •••')).toBeInTheDocument()
  })
})
