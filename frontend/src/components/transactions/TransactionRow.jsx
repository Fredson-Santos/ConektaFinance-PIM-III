import { Icon } from '../common/Icon'
import { formatCurrency } from '../../utils/format'
import { useUi } from '../../context/UiContext'

const PAYMENT_LABELS = {
  cartao: 'Cartão',
  pix: 'Pix',
  boleto: 'Boleto',
  debito: 'Débito',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
  outro: 'Outro',
}

export function TransactionRow({ transaction, onClick }) {
  const { discreet } = useUi()
  const parts = [transaction.category.name, PAYMENT_LABELS[transaction.paymentMethod] || null, transaction.isRecurrent ? 'Recorrente' : null]
  const subtitle = parts.filter(Boolean).join(' · ')
  const isExpense = transaction.type === 'expense'

  return (
    <button
      type="button"
      className="tx-row"
      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid var(--ds-border-subtle)' }}
      onClick={onClick}
      aria-label={`Lançamento ${transaction.description}`}
    >
      <span className="cat-icon" style={{ background: `${transaction.category.colorCode}22`, color: transaction.category.colorCode, borderColor: `${transaction.category.colorCode}55` }}>
        <Icon name={transaction.category.icon} size={17} />
      </span>
      <span className="tx-row-main">
        <span className="tx-row-title">{transaction.description}</span>
        <span className="tx-row-sub">{subtitle}</span>
      </span>
      <span className={`tx-value ${transaction.type} num`}>
        {discreet ? '•••' : `${isExpense ? '− ' : '+ '}${formatCurrency(transaction.value)}`}
      </span>
    </button>
  )
}

export default TransactionRow
