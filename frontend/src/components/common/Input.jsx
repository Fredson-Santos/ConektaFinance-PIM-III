import { cloneElement, isValidElement, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function Field({ label, error, hint, children }) {
  const id = useId()
  return (
    <div className="ds-form-group">
      {label ? (
        <label className="ds-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {isValidElement(children) ? cloneElement(children, { id }) : children}
      {hint && !error ? <span className="ds-hint">{hint}</span> : null}
      {error ? <span className="ds-error">{error}</span> : null}
    </div>
  )
}

export const Input = ({ hasError, className = '', ...props }) => (
  <input className={`ds-input ${hasError ? 'ds-input-error' : ''} ${className}`} {...props} />
)

export function PasswordInput({ hasError, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        className={`ds-input ${hasError ? 'ds-input-error' : ''}`}
        style={{ paddingRight: 44 }}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setVisible((current) => !current)}
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          background: 'none',
          border: 'none',
          color: 'var(--ds-foreground-muted)',
          cursor: 'pointer',
        }}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
