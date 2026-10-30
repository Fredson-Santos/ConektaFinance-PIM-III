import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Field, Input } from '../common/Input'
import { Button } from '../common/Button'
import { Icon } from '../common/Icon'
import { categoryService, transactionService } from '../../services'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'
import { parseMoneyInput } from '../../utils/money'
import { toIsoDate } from '../../utils/dates'

export function TransactionSheet() {
  const { overlays, closeOverlay, transactionPrefill, consumeTransactionPrefill, openOverlay, notifyDataChanged } = useUi()
  const editing = transactionPrefill?.editing || null

  return (
    <Modal
      open={overlays.transaction}
      onClose={() => closeOverlay('transaction')}
      title={editing ? 'Editar lançamento' : 'Novo lançamento'}
    >
      <TransactionForm
        key={`${overlays.transaction}-${editing?.id || 'new'}-${transactionPrefill?.description || ''}`}
        editing={editing}
        prefill={transactionPrefill}
        afterSubmit={() => {
          notifyDataChanged()
          if (editing?.viaDetail) openOverlay('transaction')
          closeOverlay('transaction')
          consumeTransactionPrefill()
        }}
      />
    </Modal>
  )
}

function TransactionForm({ editing, prefill, afterSubmit }) {
  const toast = useToast()
  const [type, setType] = useState(editing?.type || prefill?.type || 'expense')
  const [description, setDescription] = useState(editing?.description || prefill?.description || '')
  const [rawValue, setRawValue] = useState(
    editing ? String(editing.value).replace('.', ',') : prefill?.value ? String(prefill.value).replace('.', ',') : '',
  )
  const [date, setDate] = useState(
    editing ? toIsoDate(editing.transactionDate) : toIsoDate(new Date()),
  )
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(editing?.paymentMethod || 'pix')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const [categoriesCache, setCategoriesCache] = useState({ expense: [], income: [] })

  useEffect(() => {
    let active = true
    Promise.all([
      categoryService.list({ kind: 'expense' }).catch(() => []),
      categoryService.list({ kind: 'income' }).catch(() => []),
    ]).then(([expenseList, incomeList]) => {
      if (!active) return
      const expense = Array.isArray(expenseList) ? expenseList : []
      const income = Array.isArray(incomeList) ? incomeList : []
      setCategoriesCache({ expense, income })

      const currentList = type === 'income' ? income : expense
      const fromEditing = editing
        ? currentList.find((category) => category.id === editing.category?.id)
        : null
      const fromPrefill = prefill?.categoryName
        ? currentList.find((category) => category.name.toLowerCase() === prefill.categoryName.toLowerCase())
        : null
      const nextId = String(fromEditing?.id || fromPrefill?.id || (currentList[0] ? currentList[0].id : ''))
      if (nextId) setCategoryId(nextId)
    })
    return () => {
      active = false
    }
  }, [editing, prefill])

  const categories = categoriesCache[type] || []

  const handleTypeChange = (nextType) => {
    if (nextType === type) return
    setType(nextType)
    const list = categoriesCache[nextType] || []
    if (list.length > 0) {
      setCategoryId(String(list[0].id))
    }
  }

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(categoryId)),
    [categories, categoryId],
  )

  const submit = async (event) => {
    event.preventDefault()
    if (!description.trim()) {
      setError('Informe uma descrição para o lançamento.')
      return
    }
    const value = parseMoneyInput(rawValue)
    if (value == null) {
      setError('Informe um valor maior que zero.')
      return
    }
    if (!categoryId) {
      setError('Escolha uma categoria.')
      return
    }
    setError(null)
    setLoading(true)
    const payload = {
      type,
      categoryId: Number(categoryId),
      description: description.trim(),
      value,
      transactionDate: date,
      paymentMethod,
    }
    try {
      if (editing) {
        await transactionService.update(editing.id, payload)
        toast.push('Lançamento atualizado com sucesso!')
      } else {
        await transactionService.create(payload)
        toast.push(`${type === 'expense' ? 'Despesa' : 'Entrada'} de ${rawValue} registrada com sucesso!`)
      }
      afterSubmit()
    } catch (caught) {
      setError(caught.message)
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!editing) return
    setLoading(true)
    try {
      await transactionService.remove(editing.id)
      toast.push('Lançamento excluído.')
      afterSubmit()
    } catch (caught) {
      setError(caught.message)
      setLoading(false)
    }
  }

  const isExpense = type === 'expense'

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="auth-tabs" role="tablist" aria-label="Tipo de lançamento">
        <button
          type="button"
          role="tab"
          aria-selected={isExpense}
          className={`auth-tab ${isExpense ? 'active' : ''}`}
          onClick={() => handleTypeChange('expense')}
        >
          Despesa
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isExpense}
          className={`auth-tab ${!isExpense ? 'active' : ''}`}
          onClick={() => handleTypeChange('income')}
        >
          Entrada
        </button>
      </div>

      <Field label={isExpense ? 'Descrição da despesa' : 'Origem / Descrição da receita'}>
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={isExpense ? 'Ex.: Mercado, Uber…' : 'Ex.: Salário, freelance…'}
        />
      </Field>

      <div className="ds-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Valor (R$)">
          <div style={{ position: 'relative' }}>
            <span
              className="phone-country"
              style={{ color: isExpense ? 'var(--ds-red-700)' : 'var(--ds-green-700)', fontWeight: 700 }}
            >
              {isExpense ? '−' : '+'}
            </span>
            <Input
              inputMode="decimal"
              placeholder="0,00"
              value={rawValue}
              onChange={(event) => setRawValue(event.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </Field>
        <Field label="Data">
          <Input type="date" value={date} max={toIsoDate(new Date())} onChange={(event) => setDate(event.target.value)} />
        </Field>
      </div>

      <Field label="Categoria">
        <div className="chips" style={{ minHeight: 38, alignItems: 'center' }}>
          {(categories || []).map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${String(category.id) === String(categoryId) ? 'active' : ''}`}
              aria-pressed={String(category.id) === String(categoryId)}
              onClick={() => setCategoryId(String(category.id))}
              style={String(category.id) === String(categoryId) ? { background: category.colorCode, borderColor: category.colorCode, color: '#fff' } : undefined}
            >
              <Icon name={category.icon} size={13} /> {category.name}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Forma de pagamento">
        <select className="ds-input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
          <option value="pix">Pix</option>
          <option value="cartao">Cartão</option>
          <option value="debito">Débito</option>
          <option value="boleto">Boleto</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="transferencia">Transferência</option>
          <option value="outro">Outro</option>
        </select>
      </Field>

      {error ? <span className="ds-error">{error}</span> : null}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant={isExpense ? 'primary' : 'blue'} fullWidth loading={loading} icon={isExpense ? Minus : Plus}>
          {editing ? 'Salvar alterações' : isExpense ? 'Registrar despesa' : 'Registrar entrada'}
        </Button>
        {editing ? (
          <Button variant="danger" onClick={remove} disabled={loading}>
            Excluir
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export default TransactionSheet
