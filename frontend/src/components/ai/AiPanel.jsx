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
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={() => closeOverlay('ai')} aria-hidden="true" />
      <section className="ai-panel" role="dialog" aria-label="Assistente de IA ConektaFinance">
        <header className="ai-panel-header">
          <span className="ai-avatar">
            <Sparkles size={16} />
          </span>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5 }}>Assistente de IA</b>
            <div className="page-sub" style={{ fontSize: 11 }}>Analisa seus dados financeiros</div>
          </div>
          <button type="button" className="icon-btn" aria-label="Limpar histórico" onClick={clear}>
            <Trash2 size={16} />
          </button>
          <button type="button" className="icon-btn" aria-label="Fechar assistente" onClick={() => closeOverlay('ai')}>
            <X size={17} />
          </button>
        </header>

        <div className="ai-messages">
          {messages.length === 0 && !typing ? (
            <div className="ai-msg assistant">
              Olá! Posso resumir seu mês, apontar onde economizar e abrir o formulário para registrar um gasto. Como posso ajudar?
            </div>
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={`ai-msg ${message.role}`}>
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
            <div className="ai-msg assistant" aria-label="Digitando">
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
          className="ai-composer"
          onSubmit={(event) => {
            event.preventDefault()
            send()
          }}
        >
          <input
            className="ds-input"
            placeholder="Pergunte algo ou peça um lançamento…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Mensagem para o assistente"
          />
          <button type="submit" className="ds-btn ds-btn-blue" disabled={typing || !input.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </>
  )
}

export default AiPanel
