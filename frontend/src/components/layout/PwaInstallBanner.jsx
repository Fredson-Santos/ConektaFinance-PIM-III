import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [iosSuggestion, setIosSuggestion] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (standalone) return

    if (isIos) {
      const dismissed = localStorage.getItem('conekta_pwa_ios_dismissed')
      if (!dismissed) {
        setIosSuggestion(true)
        setVisible(true)
      }
      return
    }

    const handler = (event) => {
      event.preventDefault()
      setPrompt(event)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    if (iosSuggestion) localStorage.setItem('conekta_pwa_ios_dismissed', 'true')
  }

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        margin: '12px auto 0',
        maxWidth: 720,
        background: 'var(--ds-background-card)',
        border: '1px solid var(--ds-border-strong)',
        borderRadius: 'var(--ds-radius-xl)',
        boxShadow: 'var(--ds-shadow-medium)',
        fontSize: 13,
      }}
    >
      <Download size={18} />
      <span style={{ flex: 1 }}>
        {iosSuggestion
          ? 'Instale o ConektaFinance: toque no menu Compartilhar e depois em “Adicionar à Tela de Início”.'
          : 'Instale o ConektaFinance no seu dispositivo para acessar offline.'}
      </span>
      {prompt ? (
        <button type="button" className="ds-btn ds-btn-blue" style={{ minHeight: 34, padding: '6px 12px' }} onClick={install}>
          Instalar
        </button>
      ) : null}
      <button type="button" className="icon-btn" aria-label="Dispensar aviso de instalação" onClick={dismiss}>
        <X size={16} />
      </button>
    </div>
  )
}

export default PwaInstallBanner
