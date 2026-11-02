import { useMemo, useState } from 'react'
import { formatAxisCurrency, formatCurrency } from '../../utils/format'

const TICK_COUNT = 4

// Arredonda o máximo para um valor "redondo" (1, 2, 2,5, 5 × 10^n) para o eixo Y.
export function niceCeiling(value) {
  if (!Number.isFinite(value) || value <= 0) return 1000
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= value)
  return step * magnitude
}

function monthName(period, style) {
  const [m, y] = String(period || '').split('/')
  if (!m || !y) return period || ''
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('pt-BR', style === 'long' ? { month: 'long', year: 'numeric' } : { month: 'short' })
    .replace('.', '')
}

function NetBalance({ value }) {
  const positive = value >= 0
  return (
    <span className={`io-net ${positive ? 'pos' : 'neg'}`}>
      {positive ? '+ ' : '− '}
      {formatCurrency(Math.abs(value))}
    </span>
  )
}

// Comparativo mensal de Entradas (verde) x Saídas (vermelho) com saldo líquido no tooltip.
export function InOutChart({ items = [] }) {
  const [active, setActive] = useState(null)

  const { months, max, ticks } = useMemo(() => {
    const top = niceCeiling(Math.max(...items.flatMap((item) => [item.income || 0, item.expense || 0]), 0))
    return {
      max: top,
      ticks: Array.from({ length: TICK_COUNT }, (_, index) => (top / (TICK_COUNT - 1)) * (TICK_COUNT - 1 - index)),
      months: items.map((item, index) => {
        const income = item.income || 0
        const expense = item.expense || 0
        return {
          period: item.period,
          short: monthName(item.period, 'short'),
          long: monthName(item.period, 'long'),
          income,
          expense,
          net: income - expense,
          isLast: index === items.length - 1,
        }
      }),
    }
  }, [items])

  if (months.length === 0) {
    return <p className="io-empty">Nenhum dado no período.</p>
  }

  const lastMonth = months[months.length - 1]

  return (
    <div className="io-chart">
      <div className="io-top">
        <div className="io-legend" aria-hidden="true">
          <span><i className="in" />Entradas</span>
          <span><i className="out" />Saídas</span>
        </div>
        <span className="io-last">
          Saldo de {lastMonth.short}: <NetBalance value={lastMonth.net} />
        </span>
      </div>

      <div className="io-plot">
        <div className="io-axis" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{formatAxisCurrency(tick)}</span>
          ))}
        </div>
        <div className="io-area">
          <div className="io-grid" aria-hidden="true">
            {ticks.map((tick) => (
              <i key={tick} />
            ))}
          </div>
          <div className="io-bars">
            {months.map((month, index) => {
              const isActive = active === month.period
              const alignment = index === 0 ? 'start' : index === months.length - 1 ? 'end' : 'center'
              return (
                <button
                  type="button"
                  key={month.period}
                  className={`io-pair ${month.isLast ? 'now' : ''} ${isActive ? 'active' : ''}`}
                  aria-label={`${month.long}: entradas ${formatCurrency(month.income)}, saídas ${formatCurrency(month.expense)}, saldo ${month.net >= 0 ? 'positivo' : 'negativo'} de ${formatCurrency(Math.abs(month.net))}`}
                  aria-describedby={isActive ? 'io-tooltip' : undefined}
                  onMouseEnter={() => setActive(month.period)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(month.period)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive((current) => (current === month.period ? null : month.period))}
                >
                  {isActive ? (
                    <div id="io-tooltip" className={`io-tooltip align-${alignment}`} role="tooltip">
                      <strong>{month.long}</strong>
                      <div className="io-tip-row">
                        <span><i className="in" />Entradas</span>
                        <b>{formatCurrency(month.income)}</b>
                      </div>
                      <div className="io-tip-row">
                        <span><i className="out" />Saídas</span>
                        <b>{formatCurrency(month.expense)}</b>
                      </div>
                      <hr />
                      <div className="io-tip-row">
                        <span>Saldo</span>
                        <NetBalance value={month.net} />
                      </div>
                    </div>
                  ) : null}
                  <span className="io-pair-bars">
                    <span className="in" style={{ height: `${(month.income / max) * 100}%` }} />
                    <span className="out" style={{ height: `${(month.expense / max) * 100}%` }} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="io-labels" aria-hidden="true">
        {months.map((month) => (
          <span key={month.period} className={month.isLast ? 'now' : undefined}>{month.short}</span>
        ))}
      </div>
      <p className="io-hint">Toque ou passe o cursor em um mês para ver o saldo líquido.</p>
    </div>
  )
}

export default InOutChart
