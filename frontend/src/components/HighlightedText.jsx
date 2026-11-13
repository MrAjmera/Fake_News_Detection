import { useMemo } from 'react'
import { highlightSegments } from '../lib/highlight'

// Shows the submitted text with the API's influential terms marked. The text
// is rendered as plain React text nodes, never as HTML.
export default function HighlightedText({ text, signals }) {
  const { segments, found, missing } = useMemo(
    () => highlightSegments(text, signals),
    [text, signals]
  )

  return (
    <section className="annotated" aria-labelledby="annotated-title">
      <h2 id="annotated-title">Your text, annotated</h2>
      <p className="signals-intro">
        Terms that influenced the result are marked in place.{' '}
        <span className="legend">
          <mark className="hl fake">leans fake</mark>{' '}
          <mark className="hl real">leans real</mark>
        </span>
      </p>

      {/* tabIndex lets keyboard users scroll long text */}
      <div className="annotated-text" tabIndex={0} aria-label="Annotated article text">
        {segments.map((seg, i) =>
          seg.direction ? (
            <mark
              key={i}
              className={`hl ${seg.direction}`}
              title={`${seg.direction}-leaning term "${seg.term}" (weight ${Math.abs(seg.weight).toFixed(3)})`}
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>

      {found === 0 && (
        <p className="history-empty annotated-note">
          None of the influential terms could be located in the text, so
          nothing is marked.
        </p>
      )}
      {found > 0 && missing.length > 0 && (
        <p className="history-empty annotated-note">
          Not located in the text (shown in the list above only):{' '}
          {missing.join(', ')}.
        </p>
      )}
    </section>
  )
}
