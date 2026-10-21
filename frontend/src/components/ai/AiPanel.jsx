import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Trash2, ArrowRight } from 'lucide-react'
import { copilotService } from '../../services'
import { useUi } from '../../context/UiContext'
import { useToast } from '../../context/ToastContext'

const SUGGESTIONS = ['Resumo detalhado do mês', 'Onde posso economizar?', 'Registrar novo gasto']

export function AiPanel() {
  const { overlays, closeOverlay, openTransactionSheet } = useUi()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [suggestionsUsed, setSuggestionsUsed] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

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

  const send = async (content) => {
    const text = (content || input).trim()
    if (!text || typing) return
    setInput('')
    setTyping(true)
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() }])
    try {
      const exchange = await copilotService.sendMessage(text)
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
      setTyping(false)
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

  if (!overlays.ai) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1040 }} onClick={() => closeOverlay('ai')} aria-hidden="true" />
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
              Olá! Posso resumir seu mês, apontar onde economizar e abrir o formulário para registrar um gasto. Como posso ajudar?
            </div>
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={`ai-msg msg ${message.role === 'assistant' ? 'assistant bot' : 'user'}`}>
              {message.content}
              {message.actions?.length ? (
                <div className="ai-msg-actions">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      type="button"
                      className="quick-action"
                      onClick={() => runAction(action)}
                    >
                      <span className="qa-icon"><ArrowRight size={13} /></span>
                      {action.tool === 'open_transaction_sheet' ? 'Abrir lançamento pré-preenchido' : action.tool}
                    </button>
                  ))}
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

        <form
          className="ai-input-row"
          onSubmit={(event) => {
            event.preventDefault()
            send()
          }}
        >
          <input
            placeholder="Pergunte algo ou peça um lançamento…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Mensagem para o assistente"
          />
          <button type="submit" className="btn primary" style={{ borderRadius: 'var(--ds-radius-full)', padding: '6px 14px', fontSize: 12.5 }} disabled={typing || !input.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </>
  )
}

export default AiPanel
