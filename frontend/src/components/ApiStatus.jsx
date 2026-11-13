import { useEffect, useState } from 'react'
import { getHealth } from '../api/client'

const POLL_MS = 30000

const LABELS = {
  checking: 'Checking server…',
  online: 'Server online',
  degraded: 'Server up, model not loaded',
  offline: 'Server offline',
}

export default function ApiStatus() {
  const [state, setState] = useState('checking')

  useEffect(() => {
    let alive = true
    async function check() {
      try {
        const h = await getHealth()
        if (alive) setState(h.status === 'ok' && h.model_loaded ? 'online' : 'degraded')
      } catch {
        if (alive) setState('offline')
      }
    }
    check()
    const id = setInterval(check, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <span className={`api-status ${state}`} role="status">
      <span className="api-dot" aria-hidden="true" />
      {LABELS[state]}
    </span>
  )
}
