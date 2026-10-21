import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Trash2, ArrowRight, Paperclip, Check } from 'lucide-react'
import Markdown from 'react-markdown'
import { copilotService } from '../../services'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'

const SUGGESTIONS = ['Resumo detalhado do mês', 'Onde posso economizar?', 'Registrar novo gasto']
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function AiPanel() {
  const { overlays, closeOverlay, openTransactionSheet } = useUi()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [suggestionsUsed, setSuggestionsUsed] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)
  const sendingRef = useRef(false)

  useEffect(() => {
    if (!overlays.ai || messages.length > 0 || typing) return
    copilotService
      .history()
      .then((history) => setMessages(history.items || []))
      .catch(() => setMessages([]))
  }, [overlays.ai, messages.length, typing])

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, typing])

  const onFileSelected = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.push('Formatos aceitos: JPEG, PNG ou WebP.', 'error')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.push('A imagem deve ter no máximo 5 MB.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPendingImage({ base64: reader.result, name: file.name })
    reader.onerror = () => toast.push('Não consegui ler a imagem. Tente novamente.', 'error')
    reader.readAsDataURL(file)
  }

  const send = async (content) => {
    const text = (content || input).trim()
    const image = pendingImage
    if ((!text && !image) || typing || sendingRef.current) return
    sendingRef.current = true
    setInput('')
    setPendingImage(null)
    setTyping(true)
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        role: 'user',
        content: text || '📷 Nota fiscal enviada',
        imageUrl: image?.base64,
        createdAt: new Date().toISOString(),
      },
    ])
    try {
      const exchange = await copilotService.sendMessage(text, image?.base64 || null)
      setMessages((current) => [...current, exchange.assistantMessage])
      if (exchange.assistantMessage.actions?.length) {
        setSuggestionsUsed(true)
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: `error-${Date.now()}`, role: 'assistant', content: error.message, createdAt: new Date().toISOString() },
      ])
    } finally {
      sendingRef.current = false
      setTyping(false)
    }
  }

  const confirmDraft = async (messageId) => {
    if (confirmingId) return
    setConfirmingId(messageId)
    try {
      const confirmation = await copilotService.confirm(messageId)
      setMessages((current) =>
        current
          .map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  actions: (message.actions || []).map((action) =>
                    action.tool === 'draft_transaction' ? { ...action, status: 'consumed' } : action,
                  ),
                }
              : message,
          )
          .concat([confirmation]),
      )
      toast.push('Lançamento registrado com sucesso.')
    } catch (error) {
      toast.push(error.message, 'error')
    } finally {
      setConfirmingId(null)
    }
  }

  const clear = async () => {
    try {
      await copilotService.clearHistory()
      setMessages([])
      setSuggestionsUsed(false)
      toast.push('Histórico do assistente limpo.')
    } catch (error) {
      toast.push(error.message, 'error')
    }
  }

  const runAction = (action) => {
    const args = action.args || {}
    closeOverlay('ai')
    openTransactionSheet({
      type: args.type || 'expense',
      description: args.description,
      value: args.value != null ? Number(args.value) : undefined,
      categoryName: args.categoryName,
    })
  }

  const renderAction = (message, action, index) => {
    if (action.tool === 'draft_transaction') {
      if (action.status === 'consumed') {
        return (
          <span key={index} className="ai-draft-consumed">
            <Check size={13} /> Lançamento confirmado
          </span>
        )
      }
      return (
        <div key={index} className="ai-draft-actions">
          <button
            type="button"
            className="quick-action ai-confirm-btn"
            onClick={() => confirmDraft(message.id)}
            disabled={confirmingId === message.id}
          >
            <span className="qa-icon"><Check size={13} /></span>
            {confirmingId === message.id ? 'Registrando…' : 'Confirmar lançamento'}
          </button>
          <button type="button" className="quick-action" onClick={() => runAction(action)}>
            <span className="qa-icon"><ArrowRight size={13} /></span>
            Revisar no formulário
          </button>
        </div>
      )
    }
    return (
      <button key={index} type="button" className="quick-action" onClick={() => runAction(action)}>
        <span className="qa-icon"><ArrowRight size={13} /></span>
        {action.tool === 'open_transaction_sheet' ? 'Abrir lançamento pré-preenchido' : action.tool}
      </button>
    )
  }

  if (!overlays.ai) return null

  return (
    <>
      <div className="ai-backdrop" onClick={() => closeOverlay('ai')} aria-hidden="true" />
      <section className="ai-panel open" style={{ zIndex: 1050 }} role="dialog" aria-label="Assistente de IA ConektaFinance">
        <header className="ai-head">
          <div className="ai-head-title">
            <Sparkles size={15} className="icon" />
            <span>Assistente de IA Conekta</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button type="button" className="sheet-close" aria-label="Limpar histórico" onClick={clear} title="Limpar histórico">
              <Trash2 size={14} />
            </button>
            <button type="button" className="sheet-close" aria-label="Fechar assistente" onClick={() => closeOverlay('ai')} title="Fechar">
              <X size={15} />
            </button>
          </div>
        </header>

        <div className="ai-messages">
          {messages.length === 0 && !typing ? (
            <div className="ai-msg msg assistant bot">
              Olá! Posso resumir seu mês, apontar onde economizar, registrar gastos por aqui ou ler uma nota fiscal
              que você anexar. Como posso ajudar?
            </div>
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={`ai-msg msg ${message.role === 'assistant' ? 'assistant bot' : 'user'}`}>
              {message.imageUrl ? (
                <img
                  src={message.imageUrl}
                  alt={message.role === 'user' ? 'Imagem enviada' : 'Imagem compartilhada'}
                  className="ai-msg-image"
                  loading="lazy"
                />
              ) : null}
              {message.role === 'assistant' ? (
                <Markdown>{message.content}</Markdown>
              ) : (
                message.content
              )}
              {message.actions?.length ? (
                <div className="ai-msg-actions">
                  {message.actions.map((action, index) => renderAction(message, action, index))}
                </div>
              ) : null}
            </div>
          ))}
          {typing ? (
            <div className="ai-msg msg assistant bot" aria-label="Digitando">
              <span className="typing-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {!suggestionsUsed && messages.length === 0 ? (
          <div className="ai-suggest">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" className="ai-suggest-btn" onClick={() => send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {pendingImage ? (
          <div className="ai-pending-image">
            <img src={pendingImage.base64} alt="Nota fiscal selecionada" />
            <div className="ai-pending-info">
              <span>Nota fiscal pronta para envio</span>
              <button type="button" className="sheet-close" aria-label="Remover imagem" onClick={() => setPendingImage(null)}>
                <X size={13} />
              </button>
            </div>
          </div>
        ) : null}

        <form
          className="ai-input-row"
          onSubmit={(event) => {
            event.preventDefault()
            send()
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={onFileSelected}
            hidden
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            type="button"
            className="ai-attach-btn"
            aria-label="Anexar nota fiscal"
            title="Anexar nota fiscal (JPEG, PNG ou WebP)"
            onClick={() => fileInputRef.current?.click()}
            disabled={typing}
          >
            <Paperclip size={15} />
          </button>
          <input
            placeholder="Pergunte algo, registre um gasto ou envie uma nota…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Mensagem para o assistente"
          />
          <button
            type="submit"
            className="btn primary"
            style={{ borderRadius: 'var(--ds-radius-full)', padding: '6px 14px', fontSize: 12.5 }}
            disabled={typing || (!input.trim() && !pendingImage)}
          >
            Enviar
          </button>
        </form>
      </section>
    </>
  )
}

export default AiPanel
