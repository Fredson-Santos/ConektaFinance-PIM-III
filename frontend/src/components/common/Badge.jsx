export function Badge({ variant = 'gray', children, className = '' }) {
  return <span className={`ds-badge ds-badge-${variant} ${className}`}>{children}</span>
}

export default Badge
