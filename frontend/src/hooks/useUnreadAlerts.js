import { useEffect } from 'react'
import { useAsync } from './useAsync'
import { alertService } from '../services'

export function useUnreadAlerts(intervalMs = 60000) {
  const { data, refetch } = useAsync(() => alertService.unreadCount(), [])

  useEffect(() => {
    const timer = setInterval(() => refetch(), intervalMs)
    return () => clearInterval(timer)
  }, [refetch, intervalMs])

  return { count: data?.count || 0, refetch }
}
