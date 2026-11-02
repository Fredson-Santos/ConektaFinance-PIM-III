export function Button({
  children,
  variant = 'primary',
  size,
  loading = false,
  icon: Icon,
  fullWidth = false,
  type = 'button',
  className = '',
  disabled,
  ...props
}) {
  const variantClass =
    variant === 'blue'
      ? 'ds-btn-blue'
      : variant === 'secondary'
        ? 'ds-btn-secondary'
        : variant === 'ghost'
          ? 'ds-btn-ghost'
          : variant === 'danger'
            ? 'ds-btn-danger'
            : variant === 'whatsapp'
              ? 'ds-btn-whatsapp'
              : 'ds-btn-primary'
  return (
    <button
      type={type}
      className={`ds-btn ${variantClass} ${fullWidth ? 'ds-btn-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="ds-spinner" aria-hidden="true" />
          Aguarde…
        </>
      ) : (
        <>
          {Icon ? <Icon size={size || 16} /> : null}
          {children}
        </>
      )}
    </button>
  )
}

export default Button
