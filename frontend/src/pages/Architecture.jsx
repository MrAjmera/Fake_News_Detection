import HLDDiagram from '../components/diagrams/HLDDiagram'
import LinkSequenceDiagram from '../components/diagrams/LinkSequenceDiagram'
import PipelineDiagram from '../components/diagrams/PipelineDiagram'
import SequenceDiagram from '../components/diagrams/SequenceDiagram'

export default function Architecture() {
  return (
    <div>
      <div className="page-head">
        <h1>Architecture</h1>
        <p>
          Four views of the same system: how it's structured end to end, what
          happens when you analyze text, what happens when you paste a link,
          and what happens to the text inside the model. Every box and label
          below traces back to a real file or function in this repo.
        </p>
      </div>

      <section className="section">
        <h2>High-level design</h2>
        <p className="diagram-caption">
          How the whole system fits together — a one-time offline training
          pipeline hands the API a model it loads once and serves for every
          request. The same API also fetches article text from a link and
          saves feedback to a text file.
        </p>
        <div className="diagram-frame">
          <HLDDiagram />
        </div>
      </section>

      <section className="section">
        <h2>Request sequence — <code style={{ fontFamily: 'var(--mono)', fontWeight: 400 }}>POST /api/predict</code></h2>
        <p className="diagram-caption">
          One prediction request end to end, including the security checks and
          the guard rail: what happens when the pasted text is too short or too
          long.
        </p>
        <div className="diagram-frame">
          <SequenceDiagram />
        </div>
      </section>

      <section className="section">
        <h2>Link input — <code style={{ fontFamily: 'var(--mono)', fontWeight: 400 }}>POST /api/extract-url</code></h2>
        <p className="diagram-caption">
          What happens when you paste a link: the server checks the address is
          a public website, downloads the page, keeps only the article text and
          puts it in the text box. Links to internal addresses are refused.
        </p>
        <div className="diagram-frame">
          <LinkSequenceDiagram />
        </div>
      </section>

      <section className="section">
        <h2>ML pipeline / data flow</h2>
        <p className="diagram-caption">
          What actually happens to the text between "paste" and "verdict" —
          the same TF-IDF and Logistic Regression parameters used by
          train_v2.py and served by inference.py.
        </p>
        <div className="diagram-frame">
          <PipelineDiagram />
        </div>
      </section>
    </div>
  )
}
