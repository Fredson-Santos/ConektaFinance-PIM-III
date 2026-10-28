import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { InOutChart, niceCeiling } from '../components/charts/InOutChart'
import { formatAxisCurrency } from '../utils/format'

const TREND = [
  { period: '05/2026', income: 5000, expense: 1600, saved: 3400 },
  { period: '06/2026', income: 3000, expense: 4250.5, saved: -1250.5 },
]

describe('formatAxisCurrency', () => {
  it('abrevia valores do eixo no padrao BRL', () => {
    expect(formatAxisCurrency(0)).toBe('R$ 0')
    expect(formatAxisCurrency(500)).toBe('R$ 500')
    expect(formatAxisCurrency(1000)).toBe('R$ 1k')
    expect(formatAxisCurrency(2500)).toBe('R$ 2,5k')
    expect(formatAxisCurrency(1200000)).toBe('R$ 1,2 mi')
  })
})

describe('niceCeiling', () => {
  it('arredonda o topo do eixo para um valor redondo', () => {
    expect(niceCeiling(4250.5)).toBe(5000)
    expect(niceCeiling(1800)).toBe(2000)
    expect(niceCeiling(2300)).toBe(2500)
    expect(niceCeiling(0)).toBe(1000)
  })
})

describe('InOutChart', () => {
  it('exibe legenda semantica e eixo Y em BRL abreviado', () => {
    const { container } = render(<InOutChart items={TREND} />)

    expect(screen.getByText('Entradas')).toBeInTheDocument()
    expect(screen.getByText('Saídas')).toBeInTheDocument()
    const axis = container.querySelector('.io-axis')
    expect(axis).toHaveTextContent('R$ 5k')
    expect(axis).toHaveTextContent('R$ 0')
  })

  it('mostra entradas, saidas e saldo positivo no tooltip', () => {
    render(<InOutChart items={TREND} />)

    fireEvent.mouseEnter(screen.getByRole('button', { name: /maio de 2026/i }))
    const tooltip = screen.getByRole('tooltip')

    expect(tooltip).toHaveTextContent('R$ 5.000,00')
    expect(tooltip).toHaveTextContent('R$ 1.600,00')
    const net = within(tooltip).getByText((_, node) => node?.classList?.contains('io-net'))
    expect(net).toHaveTextContent('+ R$ 3.400,00')
    expect(net).toHaveClass('pos')
  })

  it('destaca saldo deficitario em vermelho', () => {
    render(<InOutChart items={TREND} />)

    fireEvent.focus(screen.getByRole('button', { name: /junho de 2026/i }))
    const net = within(screen.getByRole('tooltip')).getByText((_, node) => node?.classList?.contains('io-net'))

    expect(net).toHaveTextContent('− R$ 1.250,50')
    expect(net).toHaveClass('neg')
  })

  it('resume o saldo do ultimo mes e descreve cada barra para leitores de tela', () => {
    render(<InOutChart items={TREND} />)

    expect(screen.getByText(/saldo de jun/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /junho de 2026: entradas R\$ 3\.000,00, saídas R\$ 4\.250,50, saldo negativo/i })).toBeInTheDocument()
  })

  it('renderiza estado vazio sem dados', () => {
    render(<InOutChart items={[]} />)

    expect(screen.getByText('Nenhum dado no período.')).toBeInTheDocument()
  })
})
