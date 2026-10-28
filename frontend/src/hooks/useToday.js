import { useEffect, useState } from 'react'

export const WEEKDAY_KEYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']

// Índice do dia da semana começando na segunda-feira (seg = 0 ... dom = 6).
export function weekdayIndex(date) {
  return (date.getDay() + 6) % 7
}

export function normalizeWeekday(label) {
  return String(label || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .slice(0, 3)
}

export function isSameWeekday(label, date) {
  return normalizeWeekday(label) === WEEKDAY_KEYS[weekdayIndex(date)]
}

function msUntilNextMidnight(now) {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

// Data atual que se atualiza sozinha na virada do dia (e ao voltar para a aba).
export function useToday() {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const timer = setTimeout(() => setToday(new Date()), msUntilNextMidnight(today) + 1000)
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const now = new Date()
      if (now.toDateString() !== today.toDateString()) setToday(now)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [today])

  return today
}

export default useToday
