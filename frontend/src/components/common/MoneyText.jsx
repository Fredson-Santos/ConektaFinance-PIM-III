import { formatCurrency, DISCREET_MASK } from '../../utils/format'
import { useUi } from '../../context/UiContext'

export function MoneyText({ value, signed = false, className = '' }) {
  const { discreet } = useUi()
  if (discreet) return <span className={`num ${className}`}>{DISCREET_MASK}</span>
  return <span className={`num ${className}`}>{formatCurrency(value, { signed })}</span>
}

export default MoneyText
