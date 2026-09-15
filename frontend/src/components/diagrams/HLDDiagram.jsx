import { ArrowDefs, Box, HArrow, LaneLabel, VArrow } from './DiagramPrimitives'

const W = 900
const BOX_W = 140
const BOX_H = 64
const GAP = 20
const START_X = 20

const OFFLINE_Y = 56
const ONLINE_Y = 270

function cols(n) {
  return Array.from({ length: n }, (_, i) => START_X + i * (BOX_W + GAP))
}

const offlineX = cols(5)
const onlineX = cols(5)

export default function HLDDiagram() {
  return (
    <div className="diagram-scroll">
      <svg width={W} height="380" viewBox={`0 0 ${W} 380`}>
        <ArrowDefs />

        <LaneLabel x={START_X} y={24}>
          Offline — training, run once
        </LaneLabel>
        <Box
          x={offlineX[0]}
          y={OFFLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="data/raw/*.csv"
          sub={['ISOT, WELFake,', 'fake_3, CoAID']}
        />
        <Box
          x={offlineX[1]}
          y={OFFLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="Ingest + dedupe"
          sub={['train_v2.py', 'drop ~60k dupes']}
        />
        <Box
          x={offlineX[2]}
          y={OFFLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="TF-IDF fit"
          sub={['max_features=15000', 'ngram_range=(1,2)']}
        />
        <Box
          x={offlineX[3]}
          y={OFFLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="LogisticRegression"
          sub={['.fit(X_train, y_train)']}
        />
        <Box
          x={offlineX[4]}
          y={OFFLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="models_v2/*.pkl"
          sub={['model_lr_v2.pkl', 'vectorizer_v2.pkl']}
          accent
        />

        {offlineX.slice(0, -1).map((x, i) => (
          <HArrow
            key={i}
            x1={x + BOX_W}
            x2={offlineX[i + 1]}
            y={OFFLINE_Y + BOX_H / 2}
          />
        ))}

        <LaneLabel x={START_X} y={238}>
          Online — inference, per request
        </LaneLabel>
        <Box
          x={onlineX[0]}
          y={ONLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="Browser"
          sub={['React/Vite :5173', 'Analyze.jsx composer']}
        />
        <Box
          x={onlineX[1]}
          y={ONLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="FastAPI :8000"
          sub={['main.py', 'POST /api/predict']}
        />
        <Box
          x={onlineX[2]}
          y={ONLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="inference.py"
          sub={['model + vectorizer', 'held in memory']}
          accent
        />
        <Box
          x={onlineX[3]}
          y={ONLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="JSON response"
          sub={['schemas.py', 'PredictResponse']}
        />
        <Box
          x={onlineX[4]}
          y={ONLINE_Y}
          w={BOX_W}
          h={BOX_H}
          title="Result rendered"
          sub={['ResultCard.jsx', 'SignalsPanel.jsx']}
        />

        {onlineX.slice(0, -1).map((x, i) => (
          <HArrow key={i} x1={x + BOX_W} x2={onlineX[i + 1]} y={ONLINE_Y + BOX_H / 2} />
        ))}

        <VArrow
          x={offlineX[4] + BOX_W / 2}
          y1={OFFLINE_Y + BOX_H}
          y2={ONLINE_Y}
          label={['loaded once at startup', '— load_artifacts()']}
          dashed
        />
      </svg>
    </div>
  )
}
