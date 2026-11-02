import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { formatPercent } from '../../utils/format'

export function TrendBadge({ value }) {
  if (value == null || Number.isNaN(Number(value)) || Number(value) === 0) {
    return (
      <span className="trend-badge" style={{ background: 'var(--ds-gray-alpha-200)', color: 'var(--ds-foreground-muted)' }}>
        <Minus size={11} /> sem mudança
      </span>
    )
  }
  const up = Number(value) > 0
  return (
    <span className={`trend-badge ${up ? 'up' : 'down'}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {formatPercent(Math.abs(Number(value)), { decimals: 0 })}
    </span>
  )
}

export default TrendBadge
