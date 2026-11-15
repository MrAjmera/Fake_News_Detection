import { ArrowDefs } from './DiagramPrimitives'
import { SEQ_ACTOR_H, SEQ_TOP, createSequence } from './SequencePrimitives'

const W = 1040
const LIFELINE_BOTTOM = 790
const SVG_H = 804

const actors = [
  { key: 'user', x: 50, label: 'User' },
  { key: 'analyze', x: 190, label: 'Analyze.jsx' },
  { key: 'client', x: 340, label: 'client.js' },
  { key: 'fastapi', x: 490, label: 'FastAPI\nmain.py' },
  { key: 'urlfetch', x: 670, label: 'url_fetch.py' },
  { key: 'site', x: 860, label: 'Public\nnews site' },
]

const { Actor, Lifeline, Msg, SelfCall } = createSequence(actors)

export default function LinkSequenceDiagram() {
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

        <Msg from="user" to="analyze" y={78} label="paste a link, click Fetch article" />
        <Msg from="analyze" to="client" y={104} label="extractUrl(link)" />
        <Msg from="client" to="fastapi" y={130} label="POST /api/extract-url { url }" />
        <SelfCall actor="fastapi" y={150} label="rate limit 10/min, size cap" />
        <Msg from="fastapi" to="urlfetch" y={196} label="extract_from_url(url)" />
        <SelfCall actor="urlfetch" y={216} label="validate_url(): http/https, port, public address" />

        {/* alt / else branch box */}
        <rect x="20" y="254" width={W - 40} height="530" rx="6" className="dg-alt-box" />
        <rect x="20" y="254" width="150" height="20" rx="4" className="dg-alt-tag" />
        <text x="95" y="268" textAnchor="middle" className="dg-alt-tag-label">
          alt · page readable
        </text>

        <Msg from="urlfetch" to="site" y={300} label="GET page (8 s timeout, 2 MB cap)" />
        <Msg from="site" to="urlfetch" y={326} label="HTML" dashed />
        <SelfCall actor="urlfetch" y={346} label="trafilatura.extract() → article text" />
        <SelfCall actor="urlfetch" y={378} label="cut to 1,000 words / 12,000 characters" />
        <Msg from="urlfetch" to="fastapi" y={422} label="{ title, text, word_count, truncated }" dashed />
        <Msg from="fastapi" to="client" y={448} label="200 OK, JSON body" tone="ok" dashed />
        <Msg from="client" to="analyze" y={474} label="resolved data" dashed />
        <SelfCall actor="analyze" y={494} label="fill the text box; user checks it, presses Analyze" />

        <line x1="20" y1="548" x2={W - 20} y2="548" className="dg-alt-box" />
        <rect x="20" y="548" width="250" height="20" rx="4" className="dg-alt-tag" />
        <text x="145" y="562" textAnchor="middle" className="dg-alt-tag-label">
          else · refused or unreadable
        </text>

        <SelfCall
          actor="urlfetch"
          y={588}
          label="UrlError: not public / too large / no article text"
          tone="fail"
        />
        <SelfCall
          actor="fastapi"
          y={622}
          label="catch UrlError → HTTPException(400/422/502/504)"
          tone="fail"
        />
        <Msg
          from="fastapi"
          to="client"
          y={670}
          label='error, { detail: "That address is not a public website." }'
          tone="fail"
          dashed
        />
        <Msg from="client" to="analyze" y={696} label="throws ApiError(detail)" tone="fail" dashed />
        <SelfCall
          actor="analyze"
          y={716}
          label="show the message under the link box"
          tone="fail"
        />
        <text x="30" y="772" className="dg-arrow-label">
          The server never stores the page or the text; internal addresses (localhost, 10.x, 192.168.x, 169.254.x) are refused at validate_url().
        </text>
      </svg>
    </div>
  )
}
