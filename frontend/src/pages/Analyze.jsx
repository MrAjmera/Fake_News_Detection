import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MAX_WORDS, MIN_WORDS, countWords, predict } from '../api/client'
import { SAMPLES } from '../data/samples'
import ApiStatus from '../components/ApiStatus'
import FeedbackWidget from '../components/FeedbackWidget'
import HighlightedText from '../components/HighlightedText'
import HistoryPanel from '../components/HistoryPanel'
import ResultActions from '../components/ResultActions'
import ResultCard from '../components/ResultCard'
import SignalsPanel from '../components/SignalsPanel'
import StageTicker, { STAGE_COUNT } from '../components/StageTicker'
import { DATA_CLEARED_EVENT } from '../lib/consent'
import { useToast } from '../lib/toast'

const STAGE_MS = 260

function ResultSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton sk-title" />
      <div className="skeleton sk-line" />
      <div className="skeleton sk-bar" />
      <div className="skeleton sk-line short" />
    </div>
  )
}

export default function Analyze() {
  const toast = useToast()
  const [text, setText] = useState('')
  const [stage, setStage] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [analyzedText, setAnalyzedText] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [history, setHistory] = useState([])

  const words = countWords(text)
  const tooShort = words < MIN_WORDS
  const tooLong = words > MAX_WORDS
  const valid = !tooShort && !tooLong
  const progress = Math.min(100, (words / MIN_WORDS) * 100)

  // "Clear my data" in the footer must also wipe what this page holds in memory.
  useEffect(() => {
    function reset() {
      setHistory([])
      setResult(null)
      setText('')
      setError(null)
      setNotice(null)
      setStage(-1)
    }
    window.addEventListener(DATA_CLEARED_EVENT, reset)
    return () => window.removeEventListener(DATA_CLEARED_EVENT, reset)
  }, [])

  function loadSample(sample) {
    setText(sample.text)
    setResult(null)
    setError(null)
    setStage(-1)
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
      setAnalyzedText(text)
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
      toast('Analysis failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  function restore(item) {
    setText(item.text)
    setAnalyzedText(item.text)
    setResult(item.result)
    setError(null)
    setNotice(null)
    setStage(STAGE_COUNT)
  }

  function clearHistory() {
    setHistory([])
    toast('History cleared')
  }

  const counterClass = tooLong ? 'error' : tooShort && words > 0 ? 'warn' : ''
  const showEmpty = !busy && !result && !error

  return (
    <div className="analyze-grid">
      <div>
        <div className="page-head">
          <div className="page-head-row">
            <h1>Analyze an article</h1>
            <ApiStatus />
          </div>
          <p>
            Paste the full text of a news article. The model was trained on
            complete articles, so short headlines or single sentences will not
            give a meaningful result.
          </p>
        </div>

        <div className="composer">
          <label htmlFor="article-text" className="sr-only">
            Article text
          </label>
          <textarea
            id="article-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full article text here…"
            spellCheck="false"
          />
          <div
            className="count-progress"
            role="progressbar"
            aria-label="Words toward the 20-word minimum"
            aria-valuemin={0}
            aria-valuemax={MIN_WORDS}
            aria-valuenow={Math.min(words, MIN_WORDS)}
          >
            <div
              className={`count-progress-fill ${valid ? 'ok' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
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

            <div className="samples" role="group" aria-label="Sample articles">
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip"
                  onClick={() => loadSample(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {text && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setText('')
                  setNotice(null)
                }}
              >
                Clear text
              </button>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={onAnalyze}
              disabled={!valid || busy}
            >
              {busy ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>

        {notice && <p className="notice">{notice}</p>}

        {error && (
          <div className="error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="btn-secondary retry"
              onClick={onAnalyze}
              disabled={!valid || busy}
            >
              Try again
            </button>
          </div>
        )}

        {stage >= 0 && stage < STAGE_COUNT && <StageTicker stage={stage} />}
        {busy && <ResultSkeleton />}

        {showEmpty && (
          <div className="empty-state">
            <h2>No result yet</h2>
            <p>
              Paste an article above, or load a sample with the chips. Results
              show a verdict, a confidence gauge and the words behind the
              decision. Not sure how it works? Read the{' '}
              <Link to="/model">Model page</Link>.
            </p>
          </div>
        )}

        {result && (
          <>
            <ResultCard result={result} />
            <ResultActions result={result} text={analyzedText} />
            <FeedbackWidget key={result.latency_ms + result.confidence} result={result} />
            <SignalsPanel signals={result.top_signals} />
            <HighlightedText text={analyzedText} signals={result.top_signals} />
          </>
        )}
      </div>

      <HistoryPanel
        items={history}
        onSelect={restore}
        onClear={clearHistory}
      />
    </div>
  )
}
