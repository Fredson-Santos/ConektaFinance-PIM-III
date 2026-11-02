export function Meter({ value = 0, max = 100, tone, height = 8 }) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const fillClass = tone === 'warn' ? 'warn' : tone === 'over' ? 'over' : ''
  return (
    <div
      className="meter-track"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`meter-fill ${fillClass}`} style={{ width: `${percentage}%` }} />
    </div>
  )
}

export default Meter
