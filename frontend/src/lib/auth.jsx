import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_PASS, DEMO_USER } from './authConfig'
import { DATA_CLEARED_EVENT } from './consent'
import { readJSON, removeKey, writeJSON } from './storage'

// Demo sign-in: one shared id and password, checked in the browser (see
// authConfig.js). The "signed in" flag lives in local storage so it survives
// a refresh; "Sign out" and "Clear my data" both remove it.

const KEY = 'auth'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [signedIn, setSignedIn] = useState(() => readJSON(KEY)?.ok === true)
  // Only the id is kept (never the password). Older flags without an id
  // belong to the one demo user, so fall back to it.
  const [userId, setUserId] = useState(() => readJSON(KEY)?.id ?? DEMO_USER)

  useEffect(() => {
    const onCleared = () => setSignedIn(false)
    window.addEventListener(DATA_CLEARED_EVENT, onCleared)
    return () => window.removeEventListener(DATA_CLEARED_EVENT, onCleared)
  }, [])

  const signIn = useCallback((id, password) => {
    if (id.trim() === DEMO_USER && password === DEMO_PASS) {
      writeJSON(KEY, { ok: true, id: id.trim(), at: new Date().toISOString() })
      setUserId(id.trim())
      setSignedIn(true)
      return true
    }
    return false
  }, [])

  const signOut = useCallback(() => {
    removeKey(KEY)
    setSignedIn(false)
  }, [])

  const value = useMemo(
    () => ({ signedIn, userId, signIn, signOut }),
    [signedIn, userId, signIn, signOut]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
