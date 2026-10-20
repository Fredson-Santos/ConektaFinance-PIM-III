import { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { Field, Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { budgetService } from '../../services'
import { parseMoneyInput } from '../../utils/money'
import { formatCurrency } from '../../utils/format'

export function SetLimitModal({ category, month, year, onClose, onSaved }) {
  const [raw, setRaw] = useState(category.limit > 0 ? String(category.limit).replace('.', ',') : '')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const value = parseMoneyInput(raw)
    if (value == null && raw.trim() !== '0') {
      setError('Informe um valor válido (use 0 para remover o teto).')
      return
    }
    setLoading(true)
    try {
      await budgetService.upsert({
        categoryId: category.id,
        limitValue: value || 0,
        month,
        year,
      })
      onSaved()
    } catch (caught) {
      setError(caught.message)
      setLoading(false)
    }
  }

  return (
    <Modal open title={`Definir teto · ${category.name}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12.5, color: 'var(--ds-foreground-muted)' }}>
          Gasto atual do mês: <b>{formatCurrency(category.spent || 0)}</b>
        </p>
        <Field label="Teto mensal (R$)" error={error} hint="Use 0 para remover o teto desta categoria.">
          <Input
            inputMode="decimal"
            placeholder="1.500,00"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />
        </Field>
        <Button type="submit" fullWidth loading={loading}>
          Salvar teto
        </Button>
      </form>
    </Modal>
  )
}

export default SetLimitModal
