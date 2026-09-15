const STAGES = [
  'Cleaning text',
  'TF-IDF mapping (15,000 dimensions)',
  'Logistic weights',
  'Confidence scoring',
]

export default function StageTicker({ stage }) {
  return (
    <div className="stages">
      {STAGES.map((label, i) => {
        const state = i < stage ? 'done' : i === stage ? 'active' : ''
        return (
          <div key={label} className={`stage ${state}`}>
            <span className="stage-dot">{i < stage ? '✓' : ''}</span>
            {label}
          </div>
        )
      })}
    </div>
  )
}

export const STAGE_COUNT = STAGES.length
