import { ArrowDefs, Box, HArrow, LaneLabel, VArrow } from './DiagramPrimitives'

const W = 900
const H = 650
const BOX_W = 140
const BOX_H = 64
const GAP = 20
const START_X = 20

const OFFLINE_Y = 56
const ONLINE_Y = 270
const LINK_Y = 424
const FEEDBACK_Y = 566

function cols(n) {
  return Array.from({ length: n }, (_, i) => START_X + i * (BOX_W + GAP))
}

const X = cols(5)

function Row({ y, items, accentIndex = [] }) {
  return (
    <>
      {items.map(([title, sub], i) => (
        <Box key={title + i} x={X[i]} y={y} w={BOX_W} h={BOX_H} title={title} sub={sub} accent={accentIndex.includes(i)} />
      ))}
      {items.slice(0, -1).map((_, i) => (
        <HArrow key={i} x1={X[i] + BOX_W} x2={X[i + 1]} y={y + BOX_H / 2} />
      ))}
    </>
  )
}

export default function HLDDiagram() {
  return (
    <div className="diagram-scroll">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <ArrowDefs />

        <LaneLabel x={START_X} y={24}>
          Offline — training, run once
        </LaneLabel>
        <Row
          y={OFFLINE_Y}
          accentIndex={[4]}
          items={[
            ['data/raw/*.csv', ['ISOT, WELFake,', 'fake_3, CoAID']],
            ['Ingest + dedupe', ['train_v2.py', 'drop 53,955 dupes']],
            ['TF-IDF fit', ['max_features=15000', 'ngram_range=(1,2)']],
            ['LogisticRegression', ['.fit(X_train, y_train)']],
            ['models_v2/*.pkl', ['model_lr_v2.pkl', 'vectorizer_v2.pkl']],
          ]}
        />

        <LaneLabel x={START_X} y={238}>
          Online — analyze text, per request
        </LaneLabel>
        <Row
          y={ONLINE_Y}
          accentIndex={[2]}
          items={[
            ['Browser', ['React + Vite', 'sign-in gate (browser)']],
            ['FastAPI :8000', ['POST /api/predict', 'rate limit, size caps']],
            ['inference.py', ['model + vectorizer', 'held in memory']],
            ['JSON response', ['schemas.py', 'PredictResponse']],
            ['Result rendered', ['ResultCard.jsx', 'SignalsPanel.jsx']],
          ]}
        />

        <VArrow
          x={X[4] + BOX_W / 2}
          y1={OFFLINE_Y + BOX_H}
          y2={ONLINE_Y}
          label={['loaded once at startup', '— load_artifacts()']}
          dashed
        />

        <LaneLabel x={START_X} y={392}>
          Online — link input (fetch the article text first)
        </LaneLabel>
        <Row
          y={LINK_Y}
          accentIndex={[1]}
          items={[
            ['FastAPI :8000', ['POST /api/extract-url', 'rate limit 10/min']],
            ['url_fetch.py', ['SSRF checks: public', 'addresses only']],
            ['Public news page', ['http/https, 8 s,', '2 MB cap, HTML only']],
            ['trafilatura', ['article text only,', 'cut to 1,000 words']],
            ['Analyze.jsx', ['fills the text box,', 'user presses Analyze']],
          ]}
        />

        <LaneLabel x={START_X} y={534}>
          Online — feedback
        </LaneLabel>
        <Row
          y={FEEDBACK_Y}
          accentIndex={[2]}
          items={[
            ['FeedbackWidget', ['thumbs + comment', 'copy kept in browser']],
            ['FastAPI :8000', ['POST /api/feedback', 'rate limit 20/min']],
            ['feedback.txt', ['one line per entry,', 'never the article']],
          ]}
        />
      </svg>
    </div>
  )
}
