import { Inbox } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="empty-state">
      <Icon size={34} strokeWidth={1.5} />
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  )
}

export default EmptyState
