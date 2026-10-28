export function formatCurrency(value, options = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const { signed = false } = options
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
    .format(Math.abs(Number(value)))
    .replace(/\u00A0/g, ' ')
  if (signed && Number(value) < 0) return `− ${formatted}`
  return formatted
}

export function formatCompact(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const abs = Math.abs(Number(value))
  if (abs >= 1000) return `R$ ${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1).replace('.', ',')} mil`
  return formatCurrency(value)
}

// Rótulos de eixo em BRL abreviado: R$ 0, R$ 500, R$ 1k, R$ 2,5k, R$ 1,2 mi.
export function formatAxisCurrency(value) {
  const abs = Math.abs(Number(value) || 0)
  const sign = Number(value) < 0 ? '−' : ''
  const trim = (number) => String(Number(number.toFixed(1))).replace('.', ',')
  if (abs >= 1_000_000) return `${sign}R$ ${trim(abs / 1_000_000)} mi`
  if (abs >= 1000) return `${sign}R$ ${trim(abs / 1000)}k`
  return `${sign}R$ ${Math.round(abs)}`
}

export function formatPercent(value, { signed = false, decimals = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const fixed = Number(value).toFixed(decimals).replace('.', ',')
  return `${signed && Number(value) > 0 ? '+' : ''}${fixed}%`
}

export const DISCREET_MASK = 'R$ •••'
