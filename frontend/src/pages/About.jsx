import { Link } from 'react-router-dom'

const STACK = [
  ['Interface', 'React 19, React Router, Vite'],
  ['API', 'FastAPI, Pydantic, Uvicorn'],
  ['Model', 'scikit-learn: TF-IDF (15,000 features, 1–2-grams) + Logistic Regression'],
  ['Serving', 'Model and vectorizer loaded once at startup with joblib'],
]

// Sources and names exactly as listed in data/README.md and src/train_v2.py.
const DATASETS = [
  {
    name: 'ISOT Fake News (Fake.csv, True.csv)',
    note: 'Real and fake news articles. Source listed in the project data README: Kaggle fake-news dataset.',
    href: 'https://www.kaggle.com/c/fake-news/data',
  },
  {
    name: 'WELFake',
    note: '72,134 articles. Source: Zenodo record 4561253.',
    href: 'https://zenodo.org/record/4561253',
  },
  {
    name: 'fake_3',
    note: 'Additional fake/real articles used by the V2 training script.',
  },
  {
    name: 'CoAID',
    note: 'Health-news articles used by the V2 training script.',
  },
]

const STORY = [
  [
    'V1 stalled at 69.21%.',
    'Raw counts such as entity_count = 350 were fed in next to TF-IDF scores of about 0.05, with no scaling, so training could not learn properly.',
  ],
  [
    'Clickbait data was removed.',
    'A clickbait headline set taught the model to flag sensational wording, which genuine outlets also use.',
  ],
  [
    'Duplicate leakage was removed.',
    'About 60,000 identical articles appeared in more than one dataset, so some test articles had also been seen in training. Exact-text deduplication fixed that.',
  ],
  [
    'V2 reached 95.14% (served) and 95.61% (best).',
    'The served model is Logistic Regression on TF-IDF features. It is slightly below the Random Forest, but it lets the app show which words in your text drove the result.',
  ],
]

export default function About() {
  return (
    <article className="prose">
      <div className="page-head">
        <h1>About</h1>
        <p>
          A fake-news detector built to show the whole path: paste an article,
          see the verdict and the reasons, then check how the model was built
          and tested.
        </p>
      </div>

      <section className="section">
        <h2>Project</h2>
        <div className="card">
          <dl className="meta-list">
            <div className="meta-item">
              <dt>Project</dt>
              <dd>Fake News Detection, PBL-1 (CSE2170)</dd>
            </div>
            <div className="meta-item">
              <dt>Institution</dt>
              <dd>Manipal University Jaipur</dd>
            </div>
            <div className="meta-item">
              <dt>Team</dt>
              <dd>Krrish Ajmera</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section">
        <h2>Stack</h2>
        <div className="card">
          <dl className="meta-list">
            {STACK.map(([k, v]) => (
              <div className="meta-item" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section">
        <h2>From V1 to V2 in four points</h2>
        <div className="card">
          <div className="story">
            {STORY.map(([title, body], i) => (
              <div className="story-row" key={title}>
                <span className="story-num">{String(i + 1).padStart(2, '0')}</span>
                <p>
                  <b>{title}</b> {body}
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="diagram-caption" style={{ marginTop: '0.875rem' }}>
          The full evaluation is on the <Link to="/model">Model</Link> page.
        </p>
      </section>

      <section className="section">
        <h2>Dataset credits</h2>
        <div className="card">
          <ul className="credits">
            {DATASETS.map((d) => (
              <li key={d.name}>
                <b>{d.name}</b>
                <p>
                  {d.note}{' '}
                  {d.href && (
                    <a href={d.href} target="_blank" rel="noreferrer noopener">
                      Source
                    </a>
                  )}
                </p>
              </li>
            ))}
          </ul>
          <p className="notice">
            Each dataset remains the property of its original authors and is
            subject to the licence its publisher sets at the source above. The
            datasets are used here only for academic model training and are not
            redistributed in this project&apos;s repository.
          </p>
        </div>
      </section>
    </article>
  )
}
