import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useUi } from '../../context/UiContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const DRAG_THRESHOLD = 8
const MARGIN = 16
const TOP_MARGIN = 76
const BOTTOM_MARGIN = 96

export function AiFab() {
  const { openOverlay, overlays } = useUi()
  const isMobile = useMediaQuery('(max-width: 880px)')
  const [position, setPosition] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [wiggle, setWiggle] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const dragState = useRef({ startX: 0, startY: 0, origin: null, moved: false, vx: 0, lastX: 0 })

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

  const onPointerDown = (event) => {
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      origin: position || { right: 20, bottom: 96 },
      moved: false,
      vx: 0,
      lastX: event.clientX,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    const state = dragState.current
    if (!state.origin) return
    const deltaX = event.clientX - state.startX
    const deltaY = event.clientY - state.startY
    if (Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) return
    state.moved = true
    setDragging(true)
    state.vx = event.clientX - state.lastX
    state.lastX = event.clientX
    const fab = event.currentTarget.getBoundingClientRect()
    const left = Math.min(window.innerWidth - MARGIN - fab.width, Math.max(MARGIN, state.origin.left ?? event.clientX - fab.width / 2 + deltaX))
    const top = Math.min(window.innerHeight - BOTTOM_MARGIN - fab.height, Math.max(TOP_MARGIN, state.origin.top ?? event.clientY - fab.height / 2 + deltaY))
    setPosition({ left, top })
    state.origin = { left, top }
  }

  const onPointerUp = (event) => {
    const state = dragState.current
    setDragging(false)
    if (!state.moved) {
      openOverlay('ai')
      return
    }
    const fab = event.currentTarget.getBoundingClientRect()
    const centerX = fab.left + fab.width / 2 + state.vx * 15
    const snapLeft = centerX < window.innerWidth / 2
    const left = snapLeft ? MARGIN : window.innerWidth - MARGIN - fab.width
    const top = Math.min(window.innerHeight - BOTTOM_MARGIN - fab.height, Math.max(TOP_MARGIN, fab.top))
    setPosition({ left, top })
  }

  const style = position
    ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' }
    : undefined

  return (
    <>
      <button
        type="button"
        className={`ai-fab ${dragging ? 'dragging' : ''} ${wiggle ? 'wiggle' : ''}`}
        aria-label="Abrir assistente de IA"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ ...style, display: overlays.ai ? 'none' : undefined }}
      >
        <Sparkles size={22} />
      </button>
      {showLabel && !overlays.ai ? <span className="ai-fab-label" style={{ right: 84, bottom: 108 }}>Assistente de IA</span> : null}
    </>
  )
}

export default AiFab
