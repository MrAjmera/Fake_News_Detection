// Safe wrapper around localStorage. Storage can be blocked (private windows,
// site-data settings) or throw, so every call is wrapped and the app must keep
// working without it. All keys share one prefix so "Clear my data" can remove
// everything this app ever stored and nothing else.

const PREFIX = 'fnd:'

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // storage unavailable — nothing to remove
  }
}

export function clearAllData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // storage unavailable — nothing to clear
  }
}
