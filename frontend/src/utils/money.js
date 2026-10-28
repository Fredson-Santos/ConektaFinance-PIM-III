export function parseMoneyInput(raw) {
  if (!raw) return null
  const cleaned = raw
    .replace(/[Rr]\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) && value > 0 ? value : null
}

// Máscara monetária por centavos: "350000" -> "3.500,00".
export function maskMoney(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 11)
  if (!digits) return ''
  const cents = digits.padStart(3, '0')
  const integer = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${integer},${cents.slice(-2)}`
}

export function moneyToMask(value) {
  if (value == null || !Number.isFinite(Number(value))) return ''
  return maskMoney(Math.round(Number(value) * 100))
}

export function passwordStrength(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/\d/.test(password) && /[a-zA-Z]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  return Math.min(score, 4)
}
