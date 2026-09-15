import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getModelInfo } from '../api/client'

const REPORT_ROWS = [
  ['True News', '0.96', '0.92', '0.94', '7,305'],
  ['Fake News', '0.93', '0.97', '0.95', '8,382'],
  ['Overall accuracy', '—', '—', '0.95', '15,687'],
]

const FIXES = [
  [
    'Clickbait contamination',
    'clickbait_data.csv was teaching the model to flag sensational phrasing rather than actual misinformation — legitimate outlets write clickbait too. Dropped from ingestion.',
  ],
  [
    'Feature-scale poisoning',
    'Raw integer features (entity_count = 350) were stacked directly alongside TF-IDF floats (0.05). Without normalisation, gradient descent penalised the coefficients and capped accuracy near 64–69%.',
  ],
  [
    'Duplicate leakage',
    'WELFake already contains ISOT variants, so identical articles sat on both sides of the train/test split. Strict deduplication on exact text removed ~60,000 entries.',
  ],
]

export default function Model() {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getModelInfo().then(setInfo).catch((e) => setError(e.message))
  }, [])

  const scores = info
    ? [
        ['Random Forest', info.accuracy.random_forest, 'best overall'],
        ['Logistic Regression', info.accuracy.logistic_regression, 'served here'],
        ['Weighted Ensemble', info.accuracy.weighted_ensemble, ''],
        ['Naive Bayes', info.accuracy.naive_bayes, 'baseline'],
      ]
    : []

  return (
    <div>
      <div className="page-head">
        <h1>Model</h1>
        <p>
          V2 pipeline — TF-IDF over 15,000 features with bigrams, feeding a
          Logistic Regression classifier. These figures come from the recorded
          V2 training run; nothing is recomputed at request time.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="score-grid">
        {scores.map(([name, value, tag]) => (
          <div
            key={name}
            className={`score-card ${tag === 'served here' ? 'lead' : ''}`}
          >
            <div className="score-value">{value.toFixed(2)}%</div>
            <div className="score-label">{name}</div>
            {tag && <div className="score-tag">{tag}</div>}
          </div>
        ))}
      </div>

      <section className="section">
        <h2>Classification report</h2>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-score</th>
                <th>Support</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_ROWS.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>V1 → V2</h2>
        <div className="card">
          <div className="jump">
            <span className="jump-from">69.21%</span>
            <span className="jump-to">95.61%</span>
            <span className="jump-label">after three pipeline fixes</span>
          </div>
          <div className="story">
            {FIXES.map(([title, body], i) => (
              <div className="story-row" key={title}>
                <span className="story-num">{String(i + 1).padStart(2, '0')}</span>
                <p>
                  <b>{title}.</b> {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {info && (
        <section className="section">
          <h2>Configuration</h2>
          <div className="card">
            <dl className="meta-list">
              <div className="meta-item">
                <dt>Model</dt>
                <dd>{info.model_type}</dd>
              </div>
              <div className="meta-item">
                <dt>Features</dt>
                <dd>{info.feature_count.toLocaleString()}</dd>
              </div>
              <div className="meta-item">
                <dt>N-gram range</dt>
                <dd>({info.ngram_range.join(', ')})</dd>
              </div>
              <div className="meta-item">
                <dt>Training corpora</dt>
                <dd>{info.training_corpora.join(', ')}</dd>
              </div>
            </dl>
            <p className="notice">{info.deduplication_note}</p>
          </div>
        </section>
      )}

      <section className="section viz">
        <h2>Visualizations</h2>
        <div className="viz-grid">
          <figure>
            <img src="/static/viz/feature_importance.png" alt="Feature importance" />
            <figcaption>
              Global feature importance across the corpus — distinct from the
              per-article signals shown on the Analyze screen.
            </figcaption>
          </figure>
        </div>
        <p className="notice" style={{ marginTop: '1rem' }}>
          Looking for the decision-tree diagram? It's been replaced by the{' '}
          <Link to="/architecture">Architecture</Link> page — three diagrams
          (system design, request sequence, and the actual ML pipeline) built
          from the real endpoints and parameters in this repo, rather than a
          raw sklearn tree export.
        </p>
      </section>
    </div>
  )
}
