import { useState } from 'react'
import { MAX_COMMENT_CHARS, feedbackStore } from '../lib/feedbackStore'
import { downloadJSON } from '../lib/resultActions'
import { useToast } from '../lib/toast'

export default function FeedbackWidget({ result }) {
  const toast = useToast()
  const [rating, setRating] = useState(null)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [synced, setSynced] = useState(true)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!rating || busy) return
    setBusy(true)
    try {
      const { synced } = await feedbackStore.save({
        rating,
        comment,
        verdict: result.verdict,
        confidence_band: result.confidence_band,
        confidence: result.confidence,
      })
      setSent(true)
      setSynced(synced)
      toast(
        synced
          ? 'Thanks, your feedback was saved'
          : 'Saved on this device only; the server could not be reached',
        synced ? 'success' : 'info'
      )
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function exportAll() {
    const entries = await feedbackStore.list()
    if (entries.length === 0) {
      toast('No feedback saved yet')
      return
    }
    downloadJSON('fake-news-feedback.json', entries)
    toast(`Exported ${entries.length} feedback ${entries.length === 1 ? 'entry' : 'entries'}`, 'success')
  }

  return (
    <section className="feedback" aria-labelledby="feedback-title">
      <h2 id="feedback-title">Was this result useful?</h2>

      {sent ? (
        <p className="feedback-thanks" role="status">
          {synced
            ? 'Thank you. Your feedback was saved.'
            : 'Thank you. The server could not be reached, so your feedback was saved on this device only.'}
        </p>
      ) : (
        <form onSubmit={submit}>
          <div className="feedback-rate" role="group" aria-label="Rate this result">
            <button
              type="button"
              className={`rate-btn ${rating === 'up' ? 'on' : ''}`}
              aria-pressed={rating === 'up'}
              onClick={() => setRating('up')}
            >
              <span aria-hidden="true">👍</span> Helpful
            </button>
            <button
              type="button"
              className={`rate-btn ${rating === 'down' ? 'on' : ''}`}
              aria-pressed={rating === 'down'}
              onClick={() => setRating('down')}
            >
              <span aria-hidden="true">👎</span> Not helpful
            </button>
          </div>

          {rating && (
            <div className="feedback-comment">
              <label htmlFor="feedback-comment">Comment (optional)</label>
              <textarea
                id="feedback-comment"
                value={comment}
                maxLength={MAX_COMMENT_CHARS}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What was right or wrong about this result?"
                rows={3}
              />
              <div className="feedback-foot">
                <span className="counter">
                  {comment.length}/{MAX_COMMENT_CHARS}
                </span>
                <button type="submit" className="btn-primary" disabled={busy}>
                  Save feedback
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      <p className="feedback-note">
        Your rating and comment are saved to the project&apos;s feedback file and
        to this browser. Your article text is never included.{' '}
        <button type="button" className="link-btn footer-btn" onClick={exportAll}>
          Export feedback (JSON)
        </button>
      </p>
    </section>
  )
}
