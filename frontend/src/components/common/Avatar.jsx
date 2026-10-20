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
        background: 'linear-gradient(135deg, var(--ds-blue-700), var(--ds-teal-700))',
        color: '#fff',
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius }} /> : initials}
    </div>
  )
}

export default Avatar
