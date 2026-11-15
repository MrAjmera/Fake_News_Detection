import { ArrowDefs } from './DiagramPrimitives'
import { SEQ_ACTOR_H, SEQ_TOP, createSequence } from './SequencePrimitives'

const W = 1040
const LIFELINE_BOTTOM = 750
const SVG_H = 764

const actors = [
  { key: 'user', x: 50, label: 'User' },
  { key: 'analyze', x: 190, label: 'Analyze.jsx' },
  { key: 'client', x: 340, label: 'client.js' },
  { key: 'fastapi', x: 490, label: 'FastAPI\nmain.py' },
  { key: 'inference', x: 660, label: 'inference.py' },
  { key: 'schemas', x: 840, label: 'schemas.py' },
]

const { Actor, Lifeline, Msg, SelfCall } = createSequence(actors)

export default function SequenceDiagram() {
  return (
    <div className="diagram-scroll">
      <svg width={W} height={SVG_H} viewBox={`0 0 ${W} ${SVG_H}`}>
        <ArrowDefs />

        {actors.map((a) => (
          <Lifeline key={a.key} x={a.x} top={SEQ_TOP + SEQ_ACTOR_H} bottom={LIFELINE_BOTTOM} />
        ))}
        {actors.map((a) => (
          <Actor key={a.key} x={a.x} label={a.label} />
        ))}

        <Msg from="user" to="analyze" y={78} label="paste article, click Analyze" />
        <Msg from="analyze" to="client" y={104} label="predict(text)" />
        <Msg from="client" to="fastapi" y={130} label="POST /api/predict { text }" />
        <SelfCall actor="fastapi" y={150} label="rate limit, size cap, schema check" />
        <Msg from="fastapi" to="inference" y={196} label="predict(text)" />
        <SelfCall actor="inference" y={216} label="validate_text() → word_count" />

        {/* alt / else branch box */}
        <rect x="20" y="254" width={W - 40} height="494" rx="6" className="dg-alt-box" />
        <rect x="20" y="254" width="150" height="20" rx="4" className="dg-alt-tag" />
        <text x="95" y="268" textAnchor="middle" className="dg-alt-tag-label">
          alt · happy path
        </text>

        <SelfCall actor="inference" y={288} label="text.lower()" />
        <SelfCall actor="inference" y={320} label="vectorizer.transform([cleaned])" />
        <SelfCall actor="inference" y={352} label="model.predict() + predict_proba()" />
        <SelfCall actor="inference" y={384} label="_explain(): coef_ × TF-IDF → top_signals" />
        <Msg from="inference" to="schemas" y={428} label="shape as PredictResponse" />
        <Msg from="inference" to="fastapi" y={452} label="return result dict" dashed />
        <Msg from="fastapi" to="client" y={476} label="200 OK, JSON body" tone="ok" dashed />
        <Msg from="client" to="analyze" y={500} label="resolved data" dashed />
        <SelfCall actor="analyze" y={518} label="render ResultCard + SignalsPanel" />

        <line x1="20" y1="552" x2={W - 20} y2="552" className="dg-alt-box" />
        <rect x="20" y="552" width="200" height="20" rx="4" className="dg-alt-tag" />
        <text x="120" y="566" textAnchor="middle" className="dg-alt-tag-label">
          else · validation failure
        </text>

        <SelfCall
          actor="inference"
          y={590}
          label="validate_text() raises ValidationError"
          tone="fail"
        />
        <SelfCall
          actor="fastapi"
          y={620}
          label="catch ValidationError → HTTPException(422)"
          tone="fail"
        />
        <Msg
          from="fastapi"
          to="client"
          y={664}
          label='422, { detail: "Input too short/long…" }'
          tone="fail"
          dashed
        />
        <Msg from="client" to="analyze" y={688} label="throws ApiError(detail)" tone="fail" dashed />
        <SelfCall
          actor="analyze"
          y={706}
          label="setError(message) → .error banner"
          tone="fail"
        />
      </svg>
    </div>
  )
}
