import { useEffect, useState } from 'react'
import { useUi } from '../../context/UiContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export function AiFab() {
  const { openOverlay, overlays } = useUi()
  const isMobile = useMediaQuery('(max-width: 880px)')
  const [wiggle, setWiggle] = useState(false)
  const [openingAnimation, setOpeningAnimation] = useState(true)

  useEffect(() => {
    // Animação de entrada e pulso chamativo ao abrir/carregar a aplicação
    const openTimer = setTimeout(() => {
      setOpeningAnimation(false)
    }, 2800)

    let mobileTimer
    if (isMobile) {
      setWiggle(true)
      mobileTimer = setTimeout(() => {
        setWiggle(false)
      }, 3200)
    }

    return () => {
      clearTimeout(openTimer)
      if (mobileTimer) clearTimeout(mobileTimer)
    }
  }, [isMobile])

  return (
    <button
      type="button"
      className={`ai-fab ${openingAnimation ? 'ai-fab-intro' : ''} ${wiggle ? 'has-movement expanded' : ''}`}
      aria-label="Abrir assistente de IA"
      onClick={() => openOverlay('ai')}
      style={{ display: overlays.ai ? 'none' : undefined }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon ai-fab-sparkle">
        <path d="M12 3L14 9L20 11L14 13L12 19L10 13L4 11L10 9L12 3Z" fill="currentColor" stroke="none" />
      </svg>
      <span className="ai-fab-text">Assistente de IA</span>
      <span className="ai-fab-dot" />
    </button>
  )
}

export default AiFab
