import { useState } from 'react'
import { Modal } from '../../components/common/Modal'
import { Field, Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { categoryService } from '../../services'
import { ApiError } from '../../services/api'

const COLORS = ['#ef4444', '#f5a623', '#0070f3', '#00cc88', '#e93d82', '#8e4ec6', '#12b5cb', '#888888']

export function CategoryFormModal({ modal, onClose, onSaved, onDeleted, onConflict }) {
  const isEdit = modal.mode === 'edit'
  const [name, setName] = useState(modal.category?.name || '')
  const [description, setDescription] = useState(modal.category?.description || '')
  const [color, setColor] = useState(modal.category?.colorCode || COLORS[0])
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      if (isEdit) {
        await categoryService.update(modal.category.id, { name: name.trim(), description, colorCode: color })
      } else {
        await categoryService.create({ name: name.trim(), description, colorCode: color, kind: 'expense' })
      }
      onSaved()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) onConflict(error.message)
      else onConflict(error.message)
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    setLoading(true)
    try {
      await categoryService.remove(modal.category.id)
      onDeleted()
    } catch (error) {
      onConflict(error.message)
      setLoading(false)
    }
  }

  return (
    <Modal open title={isEdit ? 'Editar categoria' : 'Nova categoria'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Pets" required />
        </Field>
        <Field label="Descrição">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Opcional" />
        </Field>
        <Field label="Cor">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={`Cor ${option}`}
                onClick={() => setColor(option)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: option,
                  border: color === option ? '2px solid var(--ds-foreground)' : '1px solid var(--ds-border)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </Field>
        {modal.conflict ? <span className="ds-error">{modal.conflict}</span> : null}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="submit" fullWidth loading={loading}>
            {isEdit ? 'Salvar alterações' : 'Criar categoria'}
          </Button>
          {isEdit ? (
            <Button variant="danger" onClick={remove} disabled={loading}>
              Excluir
            </Button>
          ) : null}
        </div>
      </form>
    </Modal>
  )
}

export default CategoryFormModal
