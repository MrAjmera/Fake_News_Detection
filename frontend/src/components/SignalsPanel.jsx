function Column({ title, signals, max, direction }) {
  return (
    <div className="signal-col">
      <h3>{title}</h3>
      {signals.length === 0 && (
        <p className="history-empty">No terms pushed this way.</p>
      )}
      {signals.map((s) => (
        <div className="signal-row" key={`${direction}-${s.term}`}>
          <span className="signal-term" title={s.term}>
            {s.term}
          </span>
          <span className="signal-weight">{Math.abs(s.weight).toFixed(3)}</span>
          <div className="signal-track">
            <div
              className={`signal-bar ${direction}`}
              style={{ width: `${(Math.abs(s.weight) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SignalsPanel({ signals }) {
  const fake = signals.filter((s) => s.direction === 'fake')
  const real = signals.filter((s) => s.direction === 'real')
  const max = Math.max(...signals.map((s) => Math.abs(s.weight)), 0.0001)

  return (
    <section className="signals">
      <h2>Why this verdict</h2>
      <p className="signals-intro">
        Each term below actually appears in the text you submitted. The bar shows
        how much that term's TF-IDF score, multiplied by its logistic-regression
        coefficient, pushed the decision — so this is evidence from{' '}
        <em>this article</em>, not a general list of suspicious words.
      </p>
      <div className="signal-cols">
        <Column
          title="Pushing toward fake"
          signals={fake}
          max={max}
          direction="fake"
        />
        <Column
          title="Pushing toward real"
          signals={real}
          max={max}
          direction="real"
        />
      </div>
    </section>
  )
}
