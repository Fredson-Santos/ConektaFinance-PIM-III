export function formatDayLabel(isoDate) {
  const date = new Date(isoDate)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  if (sameDay(date, today)) return 'Hoje'
  if (sameDay(date, yesterday)) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function toIsoDate(date) {
  const copy = new Date(date)
  const offset = copy.getTimezoneOffset()
  return new Date(copy.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export function monthPeriod(month, year) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

export function addMonths(month, year, delta) {
  const date = new Date(year, month - 1 + delta, 1)
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}
