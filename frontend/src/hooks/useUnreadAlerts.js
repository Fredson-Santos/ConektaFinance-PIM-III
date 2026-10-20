import { useEffect } from 'react'
import { useAsync } from './useAsync'
import { alertService } from '../services'

export function useUnreadAlerts(intervalMs = 60000) {
  const state = useAsync(() => alertService.unreadCount(), [])

  useEffect(() => {
    const timer = setInterval(() => state.refetch(), intervalMs)
    return () => clearInterval(timer)
  }, [state.refetch, intervalMs])

  return { count: state.data?.count || 0, refetch: state.refetch }
}
