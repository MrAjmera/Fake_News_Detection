export default function HistoryPanel({ items, onSelect, onClear }) {
  return (
    <aside className="panel">
      <div className="panel-head">
        <h3>Session history</h3>
        {items.length > 0 && (
          <button className="link-btn" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="history-empty">
          Analyses from this session appear here. Nothing is stored after you
          close the tab.
        </p>
      ) : (
        <div className="history-list">
          {items.map((item) => {
            const tone =
              item.result.confidence_band === 'UNCERTAIN'
                ? 'uncertain'
                : item.result.verdict.toLowerCase()
            return (
              <button
                key={item.id}
                className="history-item"
                onClick={() => onSelect(item)}
              >
                <div className="history-top">
                  <span className={`history-verdict ${tone}`}>
                    {tone === 'uncertain' ? 'UNCERTAIN' : item.result.verdict}
                  </span>
                  <span className="signal-weight">
                    {item.result.confidence.toFixed(1)}%
                  </span>
                  <span className="history-time">{item.time}</span>
                </div>
                <div className="history-snippet">{item.snippet}</div>
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
