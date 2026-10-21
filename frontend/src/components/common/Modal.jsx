import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}>
      <div className="sheet open" style={wide ? { maxWidth: 640 } : undefined} onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3 className="sheet-title">{title}</h3>
          <button type="button" className="sheet-close" aria-label="Fechar" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
