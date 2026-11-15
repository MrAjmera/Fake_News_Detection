// Pure helpers for copying / exporting a prediction. No API calls here.

export function summarise(result) {
  const lines = [
    `Verdict: ${result.confidence_band === 'UNCERTAIN' ? 'UNCERTAIN' : result.verdict}`,
    `Confidence: ${result.confidence.toFixed(2)}% (${result.confidence_band})`,
    `Real ${result.probabilities.real.toFixed(2)}% / Fake ${result.probabilities.fake.toFixed(2)}%`,
  ]
  if (result.top_signals.length) {
    lines.push(
      'Influential terms: ' +
        result.top_signals.map((s) => `${s.term} (${s.direction})`).join(', ')
    )
  }
  lines.push(
    'Produced by an academic demo model. It estimates writing style and is not a fact-checker.'
  )
  return lines.join('\n')
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
