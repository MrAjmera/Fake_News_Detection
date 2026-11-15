// Finds where the API's influential terms occur in the submitted text.
//
// The vectorizer lower-cases the text and splits it into word tokens; a
// bigram such as "on tuesday" is two adjacent tokens with any punctuation or
// whitespace between them. We therefore match each token literally (escaped),
// join them with a "non-word run" pattern, and compare case-insensitively.
// Nothing here builds HTML — callers render the segments as React nodes.

const WORD = '[\\p{L}\\p{N}_]'
const NON_WORD = '[^\\p{L}\\p{N}_]'

export function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPattern(term) {
  const tokens = term.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  const body = tokens.map(escapeRegExp).join(`${NON_WORD}+`)
  // Leading boundary is captured (not a look-behind) for wider browser support.
  return new RegExp(`(^|${NON_WORD})(${body})(?!${WORD})`, 'giu')
}

/**
 * @param {string} text     the article text exactly as submitted
 * @param {Array}  signals  [{term, weight, direction}] from /api/predict
 * @returns {{segments: Array, found: number, missing: string[]}}
 *   segments: [{text}] or [{text, direction, term, weight}] in reading order.
 */
export function highlightSegments(text, signals) {
  const candidates = []
  const missing = []

  for (const s of signals ?? []) {
    const pattern = typeof s.term === 'string' ? buildPattern(s.term) : null
    if (!pattern) continue
    let hits = 0
    for (const m of text.matchAll(pattern)) {
      const start = m.index + m[1].length
      const end = start + m[2].length
      if (end > start) {
        candidates.push({ start, end, signal: s })
        hits += 1
      }
    }
    if (hits === 0) missing.push(s.term)
  }

  // Strongest signal wins when two matches overlap (e.g. "tuesday" inside
  // "on tuesday").
  candidates.sort(
    (a, b) => Math.abs(b.signal.weight) - Math.abs(a.signal.weight)
  )
  const accepted = []
  for (const c of candidates) {
    if (!accepted.some((a) => c.start < a.end && a.start < c.end)) {
      accepted.push(c)
    }
  }
  accepted.sort((a, b) => a.start - b.start)

  const segments = []
  let cursor = 0
  for (const a of accepted) {
    if (a.start > cursor) segments.push({ text: text.slice(cursor, a.start) })
    segments.push({
      text: text.slice(a.start, a.end),
      direction: a.signal.direction,
      term: a.signal.term,
      weight: a.signal.weight,
    })
    cursor = a.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) })

  return { segments, found: accepted.length, missing }
}
