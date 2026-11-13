import { Link } from 'react-router-dom'

const STEPS = [
  [
    'Paste an article',
    'Drop in the full text of a news article, at least 20 words. The model was trained on complete articles, not headlines.',
  ],
  [
    'The model scores it',
    'The text is turned into 15,000 TF-IDF word and word-pair features and scored by a Logistic Regression classifier.',
  ],
  [
    'See the verdict and why',
    'You get REAL, FAKE or UNCERTAIN, a confidence figure, and the exact words in your text that pushed the decision.',
  ],
]

const LIMITS = [
  [
    'English only',
    'The model was trained on English-language articles. Other languages will give meaningless results.',
  ],
  [
    'A probability, not a verdict',
    'The output shows how closely the writing resembles the fake or real articles it learned from. Low confidence means "no answer".',
  ],
  [
    'Not a fact-checker',
    'It reads writing patterns, not facts. It cannot tell whether a claim is true, and it can be wrong, including on genuine news.',
  ],
]

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Machine-learning demo · Logistic Regression V2</p>
        <h1 id="hero-title">Does this article read like fake news?</h1>
        <p className="hero-lede">
          Paste a news article and get a verdict, a confidence score, and the
          specific words behind the decision. Then see how the model was built
          and tested.
        </p>
        <div className="hero-actions">
          <Link to="/analyze" className="btn-primary btn-link">
            Try the detector
          </Link>
          <Link to="/model" className="btn-secondary">
            See how it was evaluated
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="steps">
          {STEPS.map(([title, body], i) => (
            <li className="step card" key={title}>
              <span className="story-num">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="step-title">{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="limits-title">
        <h2 id="limits-title">What it can and can&apos;t do</h2>
        <ul className="limits">
          {LIMITS.map(([title, body]) => (
            <li key={title}>
              <b>{title}</b>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <h2 id="cta-title">Ready to try it?</h2>
        <Link to="/analyze" className="btn-primary btn-link">
          Try the detector
        </Link>
      </section>
    </div>
  )
}
