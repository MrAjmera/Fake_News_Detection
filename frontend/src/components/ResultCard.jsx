import { useEffect, useState } from 'react'

export default function ResultCard({ result }) {
  const uncertain = result.confidence_band === 'UNCERTAIN'
  const tone = uncertain ? 'uncertain' : result.verdict.toLowerCase()

  const [fill, setFill] = useState(0)
  useEffect(() => {
    setFill(0)
    const id = requestAnimationFrame(() => setFill(result.confidence))
    return () => cancelAnimationFrame(id)
  }, [result])

  return (
    <section className={`result ${tone}`}>
      <div className="verdict-row">
        <span className={`verdict ${tone}`}>
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

      <div className="meter">
        <div className="meter-head">
          <span>CONFIDENCE</span>
          <span className="meter-value">{result.confidence.toFixed(2)}%</span>
        </div>
        <div className="meter-track">
          <div className={`meter-fill ${tone}`} style={{ width: `${fill}%` }} />
        </div>
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
