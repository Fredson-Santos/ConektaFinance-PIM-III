import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const UiContext = createContext(null)

export function UiProvider({ children }) {
  const [overlays, setOverlays] = useState({
    transaction: false,
    import: false,
    cmdk: false,
    notif: false,
    ai: false,
    user: false,
  })
  const [discreet, setDiscreet] = useState(() => localStorage.getItem('conekta_discreet') === 'true')
  const [transactionPrefill, setTransactionPrefill] = useState(null)
  // Incrementado sempre que lançamentos mudam, para telas recarregarem seus indicadores.
  const [dataVersion, setDataVersion] = useState(0)

  const notifyDataChanged = useCallback(() => {
    setDataVersion((current) => current + 1)
  }, [])

  const openOverlay = useCallback((key) => {
    setOverlays((current) => ({ ...current, [key]: true }))
  }, [])

  const closeOverlay = useCallback((key) => {
    setOverlays((current) => ({ ...current, [key]: false }))
    if (key === 'transaction') setTransactionPrefill(null)
  }, [])

  const closeAllOverlays = useCallback(() => {
    setOverlays({ transaction: false, import: false, cmdk: false, notif: false, ai: false, user: false })
    setTransactionPrefill(null)
  }, [])

  const toggleOverlay = useCallback((key) => {
    setOverlays((current) => ({ ...current, [key]: !current[key] }))
  }, [])

  const openTransactionSheet = useCallback(
    (prefill = null) => {
      setTransactionPrefill(prefill)
      setOverlays((current) => ({ ...current, transaction: true }))
    },
    [],
  )

  const consumeTransactionPrefill = useCallback(() => {
    setTransactionPrefill(null)
  }, [])

  const toggleDiscreet = useCallback(() => {
    setDiscreet((current) => {
      localStorage.setItem('conekta_discreet', String(!current))
      return !current
    })
  }, [])

  const value = useMemo(
    () => ({
      overlays,
      openOverlay,
      closeOverlay,
      closeAllOverlays,
      toggleOverlay,
      openTransactionSheet,
      consumeTransactionPrefill,
      transactionPrefill,
      discreet,
      toggleDiscreet,
      dataVersion,
      notifyDataChanged,
    }),
    [overlays, openOverlay, closeOverlay, closeAllOverlays, toggleOverlay, openTransactionSheet, consumeTransactionPrefill, transactionPrefill, discreet, toggleDiscreet, dataVersion, notifyDataChanged],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const context = useContext(UiContext)
  if (!context) throw new Error('useUi deve ser usado dentro de UiProvider')
  return context
}
