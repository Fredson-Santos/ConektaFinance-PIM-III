import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useUi } from '../../context/UiContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export function AiFab() {
  const { openOverlay, overlays } = useUi()
  const isMobile = useMediaQuery('(max-width: 880px)')
  const [wiggle, setWiggle] = useState(false)
  const [showLabel, setShowLabel] = useState(false)

  useEffect(() => {
    if (!isMobile) return undefined
    setWiggle(true)
    setShowLabel(true)
    const timer = setTimeout(() => {
      setWiggle(false)
      setShowLabel(false)
    }, 3200)
    return () => clearTimeout(timer)
  }, [isMobile])

  return (
    <button
      type="button"
      className={`ai-fab ${wiggle ? 'has-movement' : ''}`}
      aria-label="Abrir assistente de IA"
      onClick={() => openOverlay('ai')}
      style={{ display: overlays.ai ? 'none' : undefined }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
        <path d="M12 3L14 9L20 11L14 13L12 19L10 13L4 11L10 9L12 3Z" fill="currentColor" stroke="none" />
      </svg>
      <span className="ai-fab-text">Assistente de IA</span>
      <span className="ai-fab-dot" />
    </button>
  )
}

export default AiFab
