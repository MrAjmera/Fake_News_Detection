import metrics from '../data/metrics.json'
import { deriveMetrics } from '../lib/metrics'

const pct = (x) => `${(x * 100).toFixed(1)}%`

function ConfusionMatrix({ labels, matrix }) {
  return (
    <figure className="cm">
      <div
        className="cm-grid"
        role="table"
        aria-label="Confusion matrix. Rows are actual class, columns are predicted class."
      >
        <div role="row" className="cm-row">
          <span role="columnheader" className="cm-corner">
            Actual ↓ / Predicted →
          </span>
          {labels.map((l) => (
            <span role="columnheader" className="cm-head" key={l}>
              {l}
            </span>
          ))}
        </div>
        {matrix.map((row, i) => {
          const rowTotal = row.reduce((a, b) => a + b, 0)
          return (
            <div role="row" className="cm-row" key={labels[i]}>
              <span role="rowheader" className="cm-head">
                {labels[i]}
              </span>
              {row.map((count, j) => {
                const share = rowTotal ? count / rowTotal : 0
                return (
                  <span
                    role="cell"
                    key={labels[j]}
                    className={`cm-cell ${i === j ? 'hit' : 'miss'}`}
                    style={{ '--heat': `${Math.round(share * 80)}%` }}
                  >
                    <span className="cm-num">{count.toLocaleString()}</span>
                    <span className="cm-share">{pct(share)} of actual {labels[i]}</span>
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>
      <figcaption className="diagram-caption">
        Diagonal cells are correct calls; off-diagonal cells are mistakes.
        Shading shows each cell&apos;s share of its row.
      </figcaption>
    </figure>
  )
}

export default function EvaluationSection() {
  const { labels, confusion_matrix: matrix, model, is_sample: isSample } = metrics
  const { total, accuracy, perClass } = deriveMetrics(labels, matrix)

  return (
    <section className="section" aria-labelledby="eval-title">
      <h2 id="eval-title">Evaluation: {model}</h2>

      {isSample && (
        <p className="sample-banner" role="note">
          <b>Sample data.</b> The figures in this section are placeholders and
          not the final evaluation results.
        </p>
      )}

      <div className="eval-grid">
        <div className="card table-wrap">
          <table>
            <caption className="sr-only">
              Per-class precision, recall, F1-score and support
            </caption>
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Precision</th>
                <th scope="col">Recall</th>
                <th scope="col">F1-score</th>
                <th scope="col">Support</th>
              </tr>
            </thead>
            <tbody>
              {perClass.map((c) => (
                <tr key={c.label}>
                  <th scope="row">{c.label}</th>
                  <td>{c.precision.toFixed(3)}</td>
                  <td>{c.recall.toFixed(3)}</td>
                  <td>{c.f1.toFixed(3)}</td>
                  <td>{c.support.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Overall accuracy</th>
                <td>—</td>
                <td>—</td>
                <td>{accuracy.toFixed(3)}</td>
                <td>{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <ConfusionMatrix labels={labels} matrix={matrix} />
        </div>
      </div>
    </section>
  )
}
