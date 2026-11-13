// Semicircle gauge. The arc is drawn with pathLength=100 so the stroke length
// maps 1:1 to the percentage. The fill animation is pure CSS (a keyframe that
// starts empty), so it replays whenever the component is re-keyed and is
// switched off by the global prefers-reduced-motion rule.
const ARC = 'M 10 55 A 45 45 0 0 1 100 55'

export default function ConfidenceGauge({ value, tone }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className="gauge"
      role="img"
      aria-label={`Confidence ${pct.toFixed(2)} percent`}
    >
      <svg viewBox="0 0 110 62" aria-hidden="true">
        <path className="gauge-track" d={ARC} pathLength="100" />
        <path
          className={`gauge-fill ${tone}`}
          d={ARC}
          pathLength="100"
          style={{ '--gauge-offset': 100 - pct }}
        />
      </svg>
      <div className="gauge-value">
        {pct.toFixed(2)}
        <span>%</span>
      </div>
      <div className="gauge-label">confidence</div>
    </div>
  )
}
