import { useState } from 'react'
import { MAX_WORDS, MIN_WORDS, countWords, predict } from '../api/client'
import { SAMPLES } from '../data/samples'
import HistoryPanel from '../components/HistoryPanel'
import ResultCard from '../components/ResultCard'
import SignalsPanel from '../components/SignalsPanel'
import StageTicker, { STAGE_COUNT } from '../components/StageTicker'

const STAGE_MS = 260

export default function Analyze() {
  const [text, setText] = useState('')
  const [stage, setStage] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [history, setHistory] = useState([])

  const words = countWords(text)
  const tooShort = words < MIN_WORDS
  const tooLong = words > MAX_WORDS
  const valid = !tooShort && !tooLong

  function loadSample(sample) {
    setText(sample.text)
    setResult(null)
    setError(null)
    setNotice(sample.note ?? null)
  }

  async function onAnalyze() {
    if (!valid || busy) return

    setBusy(true)
    setError(null)
    setResult(null)
    setStage(0)

    // Staged animation runs alongside the real request. It never delays the
    // result beyond its own short duration.
    const ticker = setInterval(
      () => setStage((s) => (s < STAGE_COUNT - 1 ? s + 1 : s)),
      STAGE_MS
    )
    const minDuration = new Promise((r) =>
      setTimeout(r, STAGE_MS * STAGE_COUNT)
    )

    try {
      const [data] = await Promise.all([predict(text), minDuration])
      clearInterval(ticker)
      setStage(STAGE_COUNT)
      setResult(data)
      setHistory((h) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          snippet: text.trim().slice(0, 120),
          text,
          result: data,
        },
        ...h,
      ])
    } catch (e) {
      clearInterval(ticker)
      setStage(-1)
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function restore(item) {
    setText(item.text)
    setResult(item.result)
    setError(null)
    setNotice(null)
    setStage(STAGE_COUNT)
  }

  const counterClass = tooLong ? 'error' : tooShort && words > 0 ? 'warn' : ''

  return (
    <div className="analyze-grid">
      <div>
        <div className="page-head">
          <h1>Analyze an article</h1>
          <p>
            Paste the full text of a news article. The model was trained on
            complete articles, so short headlines or single sentences will not
            give a meaningful result.
          </p>
        </div>

        <div className="composer">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full article text here…"
            spellCheck="false"
          />
          <div className="composer-bar">
            <span className={`counter ${counterClass}`}>
              {words} {words === 1 ? 'word' : 'words'}{' '}
              <em>
                {tooShort
                  ? `· need ${MIN_WORDS - words} more`
                  : tooLong
                    ? `· ${words - MAX_WORDS} over limit`
                    : `· ${MIN_WORDS}–${MAX_WORDS} ok`}
              </em>
            </span>

            <div className="samples">
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  className="chip"
                  onClick={() => loadSample(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={onAnalyze}
              disabled={!valid || busy}
            >
              {busy ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>

        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}
        {stage >= 0 && stage < STAGE_COUNT && <StageTicker stage={stage} />}

        {result && (
          <>
            <ResultCard result={result} />
            <SignalsPanel signals={result.top_signals} />
          </>
        )}
      </div>

      <HistoryPanel
        items={history}
        onSelect={restore}
        onClear={() => setHistory([])}
      />
    </div>
  )
}
