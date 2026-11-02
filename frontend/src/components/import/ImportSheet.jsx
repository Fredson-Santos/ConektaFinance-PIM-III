import { useRef, useState } from 'react'
import { UploadCloud, FileCheck2 } from 'lucide-react'
import { importService } from '../../services'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'

const ACCEPT = '.csv,.ofx,.xlsx'

export function ImportSheet() {
  const { overlays, closeOverlay } = useUi()
  return (
    <Modal open={overlays.import} title="Importar extrato" onClose={() => closeOverlay('import')} wide>
      {overlays.import ? <ImportForm onClose={() => closeOverlay('import')} /> : null}
    </Modal>
  )
}

function ImportForm({ onClose }) {
  const toast = useToast()
  const { notifyDataChanged } = useUi()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [autoCategorize, setAutoCategorize] = useState(true)
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(true)

  const runPreview = async (selected) => {
    setFile(selected)
    setError(null)
    setPreview(null)
    setLoading(true)
    try {
      const response = await importService.preview(selected)
      setPreview(response)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setLoading(false)
    }
  }

  const confirm = async () => {
    if (!preview) return
    setConfirming(true)
    try {
      const result = await importService.confirm(preview.batchId, {
        itemIds: preview.items.map((item) => item.index),
        autoCategorize,
        ignoreDuplicates,
      })
      notifyDataChanged()
      toast.push(
        `${result.importedCount} lançamento(s) importado(s)${result.skippedDuplicates > 0 ? ` · ${result.skippedDuplicates} duplicado(s) ignorado(s)` : ''}.`,
      )
      onClose()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        type="button"
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const dropped = event.dataTransfer.files[0]
          if (dropped) runPreview(dropped)
        }}
      >
        <UploadCloud size={26} strokeWidth={1.6} />
        <b>{file ? file.name : 'Arraste seu extrato ou clique para selecionar'}</b>
        <span style={{ fontSize: 11.5 }}>Formatos aceitos: OFX, CSV e XLSX · até 5MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        aria-label="Arquivo de extrato"
        onChange={(event) => {
          const selected = event.target.files[0]
          if (selected) runPreview(selected)
        }}
      />

      {loading ? (
        <p className="text-faint" style={{ fontSize: 12.5 }}>Lendo lançamentos do extrato…</p>
      ) : error ? (
        <span className="ds-error">{error}</span>
      ) : preview ? (
        <>
          <div className="otp-sent-box" style={{ fontSize: 12.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck2 size={15} />
              {preview.items.length} lançamento(s) detectado(s) em <b>{preview.fileName}</b>
            </span>
            <Badge variant="ok">Pronto</Badge>
          </div>

          <div className="import-items">
            {preview.items.map((item) => (
              <div key={item.index} className="import-item">
                <div className="import-item-main">
                  <div className="import-item-desc">{item.description}</div>
                  <div className="import-item-meta">
                    {new Date(item.date).toLocaleDateString('pt-BR')} · {item.type === 'expense' ? 'Saída' : 'Entrada'}
                    {item.suggestedCategory ? ` · sugestão: ${item.suggestedCategory.name}` : ''}
                  </div>
                </div>
                <span className="num" style={{ fontWeight: 600 }}>
                  {item.type === 'expense' ? '− ' : '+ '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                </span>
                {item.isDuplicate ? <Badge variant="gray">Duplicado</Badge> : null}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="toggle-row">
              <span>
                <b>Categorização automática por IA</b>
                <p>Aplica a categoria sugerida a todos os itens.</p>
              </span>
              <button
                type="button"
                className={`switch ${autoCategorize ? 'on' : ''}`}
                role="switch"
                aria-checked={autoCategorize}
                aria-label="Categorização automática por IA"
                onClick={() => setAutoCategorize((current) => !current)}
              >
                <i />
              </button>
            </div>
            <div className="toggle-row">
              <span>
                <b>Ignorar duplicidades já registradas</b>
                <p>Pula lançamentos idênticos a registros existentes.</p>
              </span>
              <button
                type="button"
                className={`switch ${ignoreDuplicates ? 'on' : ''}`}
                role="switch"
                aria-checked={ignoreDuplicates}
                aria-label="Ignorar duplicidades"
                onClick={() => setIgnoreDuplicates((current) => !current)}
              >
                <i />
              </button>
            </div>
          </div>

          <Button fullWidth loading={confirming} onClick={confirm}>
            Importar {preview.items.length} lançamento(s)
          </Button>
        </>
      ) : null}
    </div>
  )
}

export default ImportSheet
