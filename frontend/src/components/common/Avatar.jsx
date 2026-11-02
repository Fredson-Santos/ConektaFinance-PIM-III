export function Avatar({ name, src, size = 34, radius = '50%' }) {
  const initials = (name || 'CF')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return (
    <div
      className="cat-icon"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'var(--ds-gray-alpha-200)',
        border: '1px solid var(--ds-border)',
        color: 'var(--ds-foreground)',
        fontSize: Math.round(size * 0.36),
        fontWeight: 600,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius }} /> : initials}
    </div>
  )
}

export default Avatar
