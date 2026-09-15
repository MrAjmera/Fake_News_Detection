export const MIN_WORDS = 20
export const MAX_WORDS = 1000

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

export function getModelInfo() {
  return request('/api/model-info')
}

export function getHealth() {
  return request('/api/health')
}
