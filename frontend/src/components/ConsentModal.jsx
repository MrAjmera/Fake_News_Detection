import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useConsent } from '../lib/consent'

// Uses the native <dialog> element: the browser provides the focus trap,
// inert background and Esc handling. Esc is blocked on purpose — the notice
// has to be acknowledged, but it is hidden on /terms so people can read it.
export default function ConsentModal() {
  const { accepted, accept } = useConsent()
  const { pathname } = useLocation()
  const ref = useRef(null)
  const open = !accepted && pathname !== '/terms'

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      onCancel={(e) => e.preventDefault()}
    >
      <h2 id="consent-title">Before you start</h2>
      <div id="consent-body" className="modal-body">
        <p>
          <b>What this tool does.</b> You paste a news article and a machine
          learning model estimates how closely its writing resembles the fake
          or real articles it was trained on. It is an academic demo, not a
          fact-checker, and it can be wrong.
        </p>
        <p>
          <b>What is stored on this device.</b> Your answer to this notice, your
          light/dark choice, your demo sign-in, and a copy of any feedback you
          choose to leave. Your analysis history is kept in memory for this tab
          and disappears when you close it.
        </p>
        <p>
          <b>What is sent to the server.</b> The text you analyze is sent to
          the backend to be scored. It is not saved or logged by the app. If you
          leave feedback, your rating, optional comment and the model&apos;s
          verdict are added to a text file kept by the project team, never your
          article.
        </p>
        <p>
          You can remove everything stored on this device at any time with
          &quot;Clear my data&quot; in the page footer. Intended for users aged
          18 or over. See the{' '}
          <Link to="/terms">Terms &amp; Privacy</Link> page for details.
        </p>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-primary" onClick={accept} autoFocus>
          I understand
        </button>
      </div>
    </dialog>
  )
}
