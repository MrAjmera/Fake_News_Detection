import { useCallback, useEffect, useState } from 'react'
import { readJSON, writeJSON } from './storage'

const KEY = 'theme'
const query = () => window.matchMedia('(prefers-color-scheme: dark)')

function systemTheme() {
  try {
    return query().matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function resolve() {
  const saved = readJSON(KEY)
  return saved === 'dark' || saved === 'light' ? saved : systemTheme()
}

function apply(theme) {
  document.documentElement.dataset.theme = theme
}

// Called once before first render so there is no flash of the wrong theme.
export function initTheme() {
  apply(resolve())
}

export function useTheme() {
  const [theme, setTheme] = useState(resolve)

  // Follow the OS setting until the user makes an explicit choice.
  useEffect(() => {
    let mq
    try {
      mq = query()
    } catch {
      return undefined
    }
    const onChange = () => {
      if (readJSON(KEY) == null) {
        const next = systemTheme()
        apply(next)
        setTheme(next)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    writeJSON(KEY, next)
    apply(next)
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
