import { useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { alertService } from '../../services'
import { useAsync } from '../../hooks/useAsync'
import { useUi } from '../../context/UiContext'
import { useUnreadAlerts } from '../../hooks/useUnreadAlerts'
import { useToast } from '../../context/ToastContext'
import { Badge } from '../common/Badge'
import { formatTime } from '../../utils/dates'

const TYPE_BADGE = {
  budgetExceeded: { variant: 'bad', label: 'Estourado' },
  categoryLimit: { variant: 'warn', label: 'Atenção' },
  highExpense: { variant: 'gray', label: 'Info' },
}

export function NotificationsPopover() {
  const { overlays, closeOverlay } = useUi()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const { refetch: refetchCount } = useUnreadAlerts()
  const state = useAsync(() => (overlays.notif ? alertService.list() : Promise.resolve(null)), [overlays.notif])

  if (!overlays.notif) return null

  const act = async (action) => {
    setBusy(true)
    try {
      await action()
      await state.refetch()
      refetchCount()
    } catch (error) {
      toast.push(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const alerts = state.data || []
  const unread = alerts.filter((alert) => !alert.isRead).length

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 940 }}
        onClick={() => closeOverlay('notif')}
        aria-hidden="true"
      />
      <div className="popover" style={{ top: 72, right: 16, position: 'fixed' }}>
        <div className="popover-header">
          <span className="popover-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={15} /> Alertas de orçamento
          </span>
          <span className="ds-badge ds-badge-gray">{unread} ativos</span>
        </div>
        <div style={{ padding: 8 }}>
          {state.loading ? (
            <p className="text-faint" style={{ padding: 16, fontSize: 12.5 }}>Carregando alertas…</p>
          ) : alerts.length === 0 ? (
            <p className="text-faint" style={{ padding: 16, fontSize: 12.5 }}>
              Nenhum alerta ativo. Seus orçamentos estão sob controle.
            </p>
          ) : (
            alerts.map((alert) => {
              const badge = TYPE_BADGE[alert.type] || TYPE_BADGE.highExpense
              return (
                <div key={alert.id} className="import-item" style={{ alignItems: 'flex-start' }}>
                  <div className="import-item-main">
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <span className="text-faint" style={{ fontSize: 10.5 }}>{formatTime(alert.createdAt)}</span>
                    </div>
                    <div className="import-item-desc">{alert.title}</div>
                    <div className="import-item-meta">{alert.message}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!alert.isRead ? (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Marcar ${alert.title} como lido`}
                        disabled={busy}
                        onClick={() => act(() => alertService.markRead(alert.id))}
                      >
                        <Check size={15} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Dispensar ${alert.title}`}
                      disabled={busy}
                      onClick={() => act(() => alertService.dismiss(alert.id))}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationsPopover
