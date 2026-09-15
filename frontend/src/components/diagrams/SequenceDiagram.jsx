import { ArrowDefs } from './DiagramPrimitives'

const W = 1040
const TOP = 20
const ACTOR_H = 34
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

const ax = Object.fromEntries(actors.map((a) => [a.key, a.x]))

function Actor({ x, label, y = TOP }) {
  const lines = label.split('\n')
  return (
    <g>
      <rect x={x - 62} y={y} width="124" height={ACTOR_H} rx="6" className="dg-actor-box" />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + ACTOR_H / 2 + (lines.length > 1 ? (i === 0 ? -3 : 10) : 4)}
          textAnchor="middle"
          className="dg-actor-label"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

function Lifeline({ x, top, bottom }) {
  return <line x1={x} y1={top} x2={x} y2={bottom} className="dg-lifeline" />
}

/** A directed message between two lifelines at height y. */
function Msg({ from, to, y, label, dashed, tone }) {
  const x1 = ax[from]
  const x2 = ax[to]
  const markerId = tone === 'fail' ? 'dg-arrow-head-fake' : tone === 'ok' ? 'dg-arrow-head-real' : 'dg-arrow-head'
  const strokeVar = tone === 'fail' ? 'var(--fake)' : tone === 'ok' ? 'var(--real)' : undefined
  return (
    <g>
      <text
        x={(x1 + x2) / 2}
        y={y - 6}
        textAnchor="middle"
        className="dg-arrow-label"
        style={strokeVar ? { fill: strokeVar } : undefined}
      >
        {label}
      </text>
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        className={`dg-arrow${dashed ? ' dashed' : ''}`}
        markerEnd={`url(#${markerId})`}
        style={strokeVar ? { stroke: strokeVar } : undefined}
      />
    </g>
  )
}

/** Self-call loop: a small rectangular bump to the right of the lifeline. */
function SelfCall({ actor, y, label, tone }) {
  const x = ax[actor]
  const w = 30
  const h = 22
  const strokeVar = tone === 'fail' ? 'var(--fake)' : undefined
  return (
    <g>
      <path
        d={`M ${x} ${y} h ${w} v ${h} h ${-w}`}
        className="dg-self-loop"
        markerEnd="url(#dg-arrow-head)"
        style={strokeVar ? { stroke: strokeVar } : undefined}
      />
      <text
        x={x + w + 8}
        y={y + h / 2 + 4}
        className="dg-arrow-label"
        style={strokeVar ? { fill: strokeVar } : undefined}
      >
        {label}
      </text>
    </g>
  )
}

export default function SequenceDiagram() {
  return (
    <div className="diagram-scroll">
      <svg width={W} height={SVG_H} viewBox={`0 0 ${W} ${SVG_H}`}>
        <ArrowDefs />

        {actors.map((a) => (
          <Lifeline key={a.key} x={a.x} top={TOP + ACTOR_H} bottom={LIFELINE_BOTTOM} />
        ))}
        {actors.map((a) => (
          <Actor key={a.key} x={a.x} label={a.label} />
        ))}

        <Msg from="user" to="analyze" y={78} label="paste article, click Analyze" />
        <Msg from="analyze" to="client" y={104} label="predict(text)" />
        <Msg from="client" to="fastapi" y={130} label="POST /api/predict { text }" />
        <Msg from="fastapi" to="inference" y={156} label="predict(text)" />
        <SelfCall actor="inference" y={176} label="validate_text() → word_count" />

        {/* alt / else branch box */}
        <rect x="20" y="214" width={W - 40} height="522" rx="6" className="dg-alt-box" />
        <rect x="20" y="214" width="150" height="20" rx="4" className="dg-alt-tag" />
        <text x="95" y="228" textAnchor="middle" className="dg-alt-tag-label">
          alt · happy path
        </text>

        <SelfCall actor="inference" y={250} label="text.lower()" />
        <SelfCall actor="inference" y={284} label="vectorizer.transform([cleaned])" />
        <SelfCall actor="inference" y={318} label="model.predict() + predict_proba()" />
        <SelfCall actor="inference" y={352} label="_explain(): coef_ × TF-IDF → top_signals" />
        <Msg from="inference" to="schemas" y={400} label="shape as PredictResponse" />
        <Msg from="inference" to="fastapi" y={426} label="return result dict" dashed />
        <Msg from="fastapi" to="client" y={452} label="200 OK, JSON body" tone="ok" dashed />
        <Msg from="client" to="analyze" y={478} label="resolved data" dashed />
        <SelfCall actor="analyze" y={498} label="render ResultCard + SignalsPanel" />

        <line x1="20" y1="528" x2={W - 20} y2="528" className="dg-alt-box" />
        <rect x="20" y="528" width="200" height="20" rx="4" className="dg-alt-tag" />
        <text x="120" y="542" textAnchor="middle" className="dg-alt-tag-label">
          else · validation failure
        </text>

        <SelfCall
          actor="inference"
          y={572}
          label="validate_text() raises ValidationError"
          tone="fail"
        />
        <SelfCall
          actor="fastapi"
          y={606}
          label="catch ValidationError → HTTPException(422)"
          tone="fail"
        />
        <Msg
          from="fastapi"
          to="client"
          y={654}
          label='422, { detail: "Input too short/long…" }'
          tone="fail"
          dashed
        />
        <Msg from="client" to="analyze" y={680} label="throws ApiError(detail)" tone="fail" dashed />
        <SelfCall
          actor="analyze"
          y={700}
          label="setError(message) → .error banner"
          tone="fail"
        />
      </svg>
    </div>
  )
}
