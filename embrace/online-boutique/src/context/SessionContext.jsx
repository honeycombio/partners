import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const SESSION_KEY = 'ob_embrace_session_id'
const CURRENCY_KEY = 'ob_embrace_currency'

function readSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return `sess-${Date.now()}`
  }
}

function readCurrency() {
  try {
    return localStorage.getItem(CURRENCY_KEY) ?? 'USD'
  } catch {
    return 'USD'
  }
}

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(readSessionId)
  const [currency, setCurrencyState] = useState(readCurrency)

  const setCurrency = useCallback((code) => {
    setCurrencyState(code)
    try {
      localStorage.setItem(CURRENCY_KEY, code)
    } catch {
      /* ignore */
    }
  }, [])

  const refreshSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setSessionId(readSessionId())
  }, [])

  const value = useMemo(
    () => ({ sessionId, currency, setCurrency, refreshSession }),
    [sessionId, currency, setCurrency, refreshSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const v = useContext(SessionContext)
  if (!v) {
    throw new Error('useSession outside SessionProvider')
  }
  return v
}
