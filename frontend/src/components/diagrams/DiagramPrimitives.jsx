// Shared inline-SVG building blocks for the Architecture page diagrams.
// Everything is styled through classes defined in index.css so the diagrams
// stay in sync with the app's colour tokens automatically.

export function ArrowDefs({ id = 'dg-arrow-head' }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill="var(--text-faint)" />
      </marker>
      <marker
        id={`${id}-real`}
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill="var(--real)" />
      </marker>
      <marker
        id={`${id}-fake`}
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill="var(--fake)" />
      </marker>
    </defs>
  )
}

/** A titled box, optionally with 1-2 lines of small mono subtext. */
export function Box({ x, y, w, h, title, sub, accent }) {
  const titleY = sub && sub.length ? y + h / 2 - 4 : y + h / 2 + 4
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="8"
        className={`dg-box-rect${accent ? ' accent' : ''}`}
      />
      <text x={x + w / 2} y={titleY} textAnchor="middle" className="dg-box-title">
        {title}
      </text>
      {(sub || []).map((line, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + h / 2 + 10 + i * 12}
          textAnchor="middle"
          className="dg-box-sub"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/** Horizontal arrow with an optional label centered above it. */
export function HArrow({ x1, x2, y, label, dataLabel, dashed, markerId = 'dg-arrow-head' }) {
  return (
    <g>
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        className={`dg-arrow${dashed ? ' dashed' : ''}`}
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={y - 6}
          textAnchor="middle"
          className={dataLabel ? 'dg-arrow-label data' : 'dg-arrow-label'}
        >
          {label}
        </text>
      )}
    </g>
  )
}

/** Vertical arrow, e.g. connecting two lanes. `label` may be a string or an
 * array of lines to avoid overflowing the viewBox on the right edge. */
export function VArrow({ x, y1, y2, label, dashed, markerId = 'dg-arrow-head' }) {
  const lines = Array.isArray(label) ? label : label ? [label] : []
  const midY = (y1 + y2) / 2
  const startY = midY - ((lines.length - 1) * 12) / 2
  return (
    <g>
      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        className={`dg-arrow${dashed ? ' dashed' : ''}`}
        markerEnd={`url(#${markerId})`}
      />
      {lines.map((line, i) => (
        <text key={i} x={x + 10} y={startY + i * 12} className="dg-arrow-label">
          {line}
        </text>
      ))}
    </g>
  )
}

export function LaneLabel({ x, y, children }) {
  return (
    <text x={x} y={y} className="dg-lane-label">
      {children}
    </text>
  )
}
