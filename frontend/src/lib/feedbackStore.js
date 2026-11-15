// Feedback storage behind a small async interface.
//
//   save(entry)  -> Promise<{ entry, synced, savedLocally }>
//   list()       -> Promise<entry[]>   this device's copy, used for JSON export
//
// Every piece of feedback is (1) sent to the backend, which appends it as one
// line to feedback.txt, and (2) kept in this browser so it can be exported.
// If the server cannot be reached the local copy still succeeds, and the UI
// says so. Entries hold the rating, an optional comment and the model's
// verdict. The article text is deliberately NOT stored or sent.

import { sendFeedback } from '../api/client'
import { readJSON, writeJSON } from './storage'

const KEY = 'feedback'
const MAX_ENTRIES = 200
export const MAX_COMMENT_CHARS = 500

export const feedbackStore = {
  async save({ rating, comment, verdict, confidence_band, confidence }) {
    if (rating !== 'up' && rating !== 'down') {
      throw new Error('Rating must be "up" or "down".')
    }
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      rating,
      comment: (comment ?? '').trim().slice(0, MAX_COMMENT_CHARS),
      verdict,
      confidence_band,
      confidence,
    }

    let synced = false
    try {
      await sendFeedback(entry)
      synced = true
    } catch {
      // server unreachable or rate-limited: fall back to the local copy below
    }

    const all = readJSON(KEY, [])
    const next = [...(Array.isArray(all) ? all : []), entry].slice(-MAX_ENTRIES)
    const savedLocally = writeJSON(KEY, next)

    if (!synced && !savedLocally) {
      throw new Error('Feedback could not be saved: the server is unreachable and browser storage is blocked.')
    }
    return { entry, synced, savedLocally }
  },

  async list() {
    const all = readJSON(KEY, [])
    return Array.isArray(all) ? all : []
  },
}
