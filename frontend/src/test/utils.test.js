import { describe, expect, it } from 'vitest'
import { formatCurrency, formatPercent } from '../utils/format'
import { parseMoneyInput, passwordStrength } from '../utils/money'
import { maskPhone, unmaskPhone } from '../utils/phone'
import { formatDayLabel, monthLabel, monthPeriod, addMonths, toIsoDate } from '../utils/dates'

describe('formatCurrency', () => {
  it('formata valores em reais pt-BR', () => {
    expect(formatCurrency(4286.5)).toBe('R$ 4.286,50')
  })

  it('retorna traco para valores invalidos', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency('abc')).toBe('—')
  })

  it('sinaliza negativos quando signed', () => {
    expect(formatCurrency(-186.4, { signed: true })).toBe('− R$ 186,40')
  })
})

describe('formatPercent', () => {
  it('formata percentual com uma casa quando pedido', () => {
    expect(formatPercent(14.25, { decimals: 1 })).toBe('14,3%')
  })

  it('adiciona sinal positivo quando signed', () => {
    expect(formatPercent(8.4, { signed: true, decimals: 1 })).toBe('+8,4%')
  })
})

describe('parseMoneyInput', () => {
  it('converte entrada monetaria pt-BR', () => {
    expect(parseMoneyInput('R$ 1.234,56')).toBe(1234.56)
    expect(parseMoneyInput('45,90')).toBe(45.9)
  })

  it('rejeita valores invalidos', () => {
    expect(parseMoneyInput('abc')).toBeNull()
    expect(parseMoneyInput('0')).toBeNull()
    expect(parseMoneyInput('')).toBeNull()
  })
})

describe('passwordStrength', () => {
  it('pontua senhas fracas e fortes', () => {
    expect(passwordStrength('abc')).toBe(0)
    expect(passwordStrength('abcdefgh')).toBe(1)
    expect(passwordStrength('SenhaForte@123')).toBe(4)
  })
})

describe('maskPhone', () => {
  it('aplica mascara progressiva de celular', () => {
    expect(maskPhone('11')).toBe('(11')
    expect(maskPhone('1198765432')).toBe('(11) 9876-5432')
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321')
  })

  it('remove nao digitos', () => {
    expect(unmaskPhone('(11) 98765-4321')).toBe('11987654321')
  })
})

describe('dates', () => {
  it('rotula hoje e ontem', () => {
    const now = new Date()
    expect(formatDayLabel(now.toISOString())).toBe('Hoje')
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    expect(formatDayLabel(yesterday.toISOString())).toBe('Ontem')
  })

  it('descreve o mes por extenso', () => {
    expect(monthLabel(10, 2026)).toBe('outubro de 2026')
  })

  it('monta o periodo do mes', () => {
    const period = monthPeriod(10, 2026)
    expect(period.start).toBe('2026-10-01')
    expect(period.end).toBe('2026-11-01')
  })

  it('navega meses com virada de ano', () => {
    expect(addMonths(1, 2027, -1)).toEqual({ month: 12, year: 2026 })
    expect(addMonths(11, 2026, 2)).toEqual({ month: 1, year: 2027 })
  })

  it('gera data iso sem timezone drift', () => {
    expect(toIsoDate(new Date(2026, 9, 17))).toBe('2026-10-17')
  })
})
