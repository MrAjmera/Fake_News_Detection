// Shared building blocks for the UML-style sequence diagrams on the
// Architecture page. `createSequence(actors)` returns components bound to one
// set of lifelines, so each diagram only has to list its actors and messages.

export const SEQ_TOP = 20
export const SEQ_ACTOR_H = 34

export function createSequence(actors) {
  const ax = Object.fromEntries(actors.map((a) => [a.key, a.x]))

  function Actor({ x, label, y = SEQ_TOP }) {
    const lines = label.split('\n')
    return (
      <g>
        <rect x={x - 62} y={y} width="124" height={SEQ_ACTOR_H} rx="6" className="dg-actor-box" />
        {lines.map((line, i) => (
          <text
            key={i}
            x={x}
            y={y + SEQ_ACTOR_H / 2 + (lines.length > 1 ? (i === 0 ? -3 : 10) : 4)}
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
    const markerId =
      tone === 'fail' ? 'dg-arrow-head-fake' : tone === 'ok' ? 'dg-arrow-head-real' : 'dg-arrow-head'
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

  return { Actor, Lifeline, Msg, SelfCall }
}
