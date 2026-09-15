import { ArrowDefs, Box, HArrow, VArrow } from './DiagramPrimitives'

const W = 340
const BOX_W = 300
const BOX_H = 60
const X = (W - BOX_W) / 2
const GAP = 36

const steps = [
  { title: 'Raw article text', sub: ['as pasted by the user'] },
  { title: 'Lowercase', sub: ['text.lower()', 'no punctuation strip, no stopwords'] },
  {
    title: 'TF-IDF vectorization',
    sub: ['TfidfVectorizer(max_features=15000,', 'ngram_range=(1,2))'],
    accent: true,
  },
  { title: 'Sparse feature vector', sub: ['1 row × 15,000 columns,', 'mostly zeros'] },
  { title: 'Logistic Regression', sub: ['coef_ (15,000 weights)', '· vector + bias'], accent: true },
  { title: 'Sigmoid → probability', sub: ['predict_proba() →', 'P(real), P(fake)'] },
  {
    title: 'Confidence banding',
    sub: ['<55% UNCERTAIN', '55–75% LOW · ≥75% HIGH'],
  },
  { title: 'Verdict', sub: ['FAKE / REAL + confidence + band'] },
]

export default function PipelineDiagram() {
  const boxY = steps.map((_, i) => 20 + i * (BOX_H + GAP))
  const height = boxY[boxY.length - 1] + BOX_H + 100

  const lrIndex = 4
  const branchY = boxY[lrIndex] + BOX_H / 2
  const branchX2 = X + BOX_W + 40
  const svgW = branchX2 + 210

  return (
    <div className="diagram-scroll">
      <svg width={svgW} height={height} viewBox={`0 0 ${svgW} ${height}`}>
        <ArrowDefs />

        {steps.map((s, i) => (
          <Box
            key={s.title}
            x={X}
            y={boxY[i]}
            w={BOX_W}
            h={BOX_H}
            title={s.title}
            sub={s.sub}
            accent={s.accent}
          />
        ))}

        {boxY.slice(0, -1).map((y, i) => (
          <VArrow key={i} x={X + BOX_W / 2} y1={y + BOX_H} y2={boxY[i + 1]} />
        ))}

        {/* side branch: same coefficients also drive the per-article explanation */}
        <HArrow
          x1={X + BOX_W}
          x2={branchX2}
          y={branchY}
          dashed
        />
        <g transform={`translate(${branchX2}, ${branchY - 34})`}>
          <rect width="200" height="68" rx="8" className="dg-box-rect accent" />
          <text x="100" y="26" textAnchor="middle" className="dg-box-title">
            top_signals
          </text>
          <text x="100" y="42" textAnchor="middle" className="dg-box-sub">
            coef_[i] × TF-IDF value
          </text>
          <text x="100" y="55" textAnchor="middle" className="dg-box-sub">
            per present term → SignalsPanel
          </text>
        </g>
      </svg>
    </div>
  )
}
