export const MIN_WORDS = 20
export const MAX_WORDS = 1000
// Mirrors MAX_TEXT_CHARS in backend/schemas.py.
export const MAX_CHARS = 12000

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export class ApiError extends Error {}

async function request(path, options) {
  let response
  try {
    response = await fetch(path, options)
  } catch {
    throw new ApiError(
      'Cannot reach the analysis server. Is the backend running on port 8000?'
    )
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // non-JSON body; handled below
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiError(
        'Too many requests. Please wait a minute and try again.'
      )
    }
    if (response.status === 413) {
      throw new ApiError('That text is too large to send.')
    }
    const detail = payload?.detail
    throw new ApiError(
      typeof detail === 'string' ? detail : `Server error (HTTP ${response.status}).`
    )
  }

  return payload
}

export function predict(text) {
  return request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

// Sends thumbs up/down + comment + the model's verdict. Never the article text.
export function sendFeedback({ rating, comment, verdict, confidence_band, confidence }) {
  return request('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment, verdict, confidence_band, confidence }),
  })
}

// Asks the server to open a public news link and return only the article text.
export function extractUrl(url) {
  return request('/api/extract-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}

export function getModelInfo() {
  return request('/api/model-info')
}

export function getHealth() {
  return request('/api/health')
}
