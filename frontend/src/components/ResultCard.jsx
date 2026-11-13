import ConfidenceGauge from './ConfidenceGauge'

export default function ResultCard({ result }) {
  const uncertain = result.confidence_band === 'UNCERTAIN'
  const tone = uncertain ? 'uncertain' : result.verdict.toLowerCase()
  const glyph = uncertain ? '?' : tone === 'fake' ? '⚠' : '✓'

  return (
    <section className={`result ${tone}`} aria-label="Analysis result">
      <div className="verdict-row">
        <span className={`verdict ${tone}`}>
          <span className="verdict-glyph" aria-hidden="true">{glyph}</span>
          {uncertain ? 'UNCERTAIN' : result.verdict}
        </span>
        <span className="band">{result.confidence_band} confidence</span>
        <span className="result-meta">
          {result.word_count} words · {result.latency_ms} ms
        </span>
      </div>

      {uncertain && (
        <p className="caution">
          The model cannot make a reliable call on this text. Below 55%
          confidence its output is not meaningfully better than a guess — treat
          this as "no answer", not as a weak verdict.
        </p>
      )}

      <div className="result-gauge-row">
        {/* keyed so the fill animation replays for every new result */}
        <ConfidenceGauge
          key={`${result.confidence}-${result.verdict}-${result.latency_ms}`}
          value={result.confidence}
          tone={tone}
        />
        <div className="split">
          <span>
            REAL <b>{result.probabilities.real.toFixed(2)}%</b>
          </span>
          <span>
            FAKE <b>{result.probabilities.fake.toFixed(2)}%</b>
          </span>
        </div>
      </div>
    </section>
  )
}
