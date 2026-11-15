import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { clearAllData, readJSON, writeJSON } from './storage'

const KEY = 'consent'
const VERSION = 1

// Fired after "Clear my data" so pages holding in-memory state (e.g. the
// Analyze session history) can reset themselves too.
export const DATA_CLEARED_EVENT = 'fnd:data-cleared'

const ConsentContext = createContext(null)

export function ConsentProvider({ children }) {
  const [accepted, setAccepted] = useState(
    () => readJSON(KEY)?.version === VERSION
  )

  const accept = useCallback(() => {
    writeJSON(KEY, { version: VERSION, at: new Date().toISOString() })
    setAccepted(true)
  }, [])

  const clearData = useCallback(() => {
    clearAllData()
    setAccepted(false)
    window.dispatchEvent(new Event(DATA_CLEARED_EVENT))
  }, [])

  const value = useMemo(
    () => ({ accepted, accept, clearData }),
    [accepted, accept, clearData]
  )
  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  )
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used inside ConsentProvider')
  return ctx
}
