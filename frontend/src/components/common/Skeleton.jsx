export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div className="ds-card" style={{ padding: 18 }} aria-hidden="true">
      <Skeleton width="40%" height={12} />
      <div style={{ height: 10 }} />
      <Skeleton height={height - 60} />
    </div>
  )
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton width={38} height={38} radius={12} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="35%" height={10} />
          </div>
          <Skeleton width={70} height={12} />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
