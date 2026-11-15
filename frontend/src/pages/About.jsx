import { Link } from 'react-router-dom'

const STACK = [
  ['Interface', 'React 19, React Router, Vite; demo sign-in gate (checked in the browser)'],
  ['API', 'FastAPI, Pydantic, Uvicorn; slowapi rate limiting, CORS allow-list, security headers'],
  ['Model', 'scikit-learn: TF-IDF (15,000 features, 1–2-grams) + Logistic Regression'],
  ['Serving', 'Model and vectorizer loaded once at startup with joblib'],
  ['Link input', 'httpx download with SSRF protection, trafilatura article extraction'],
  ['Evaluation', 'src/evaluate.py re-scores the saved model on the reproduced 80/20 test split'],
  ['Quality', '35 automated backend tests (pytest); npm audit: 0 vulnerabilities'],
]

const FEATURES = [
  ['Explained verdicts', 'Every result lists the words in your own text that pushed it towards REAL or FAKE, and highlights them in the text.'],
  ['Paste text or a link', 'Paste an article, or a link to a public news page and the server fetches only the article text. Private and internal addresses are refused.'],
  ['Honest evaluation', 'The Model page shows the real confusion matrix, precision, recall and where the model is weak.'],
  ['Feedback', 'A thumbs up or down and an optional comment are saved to a text file for the project team. The article text is never included.'],
  ['Demo sign-in', 'One shared id and password limits who opens the demo. It is a simple browser-side gate, not a secure account system.'],
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
    'Of 132,386 raw rows, 53,955 (about 41%) were exact duplicates across the datasets, so some test articles had also been seen in training. Exact-text deduplication fixed that and left 78,431 unique articles.',
  ],
  [
    'V2 reaches 95.28% accuracy (served model).',
    'Measured on 15,687 held-out test articles (ROC-AUC 0.990). The training run recorded 95.14% for the same model and 95.61% for Random Forest. Logistic Regression is served because it lets the app show which words in your text drove the result.',
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
              <dd>Fake News Detection, PBL-V</dd>
            </div>
            <div className="meta-item">
              <dt>Institution</dt>
              <dd>Manipal University Jaipur</dd>
            </div>
            <div className="meta-item">
              <dt>Team</dt>
              <dd>Krrish Ajmera</dd>
            </div>
            <div className="meta-item">
              <dt>Registration no.</dt>
              <dd>2427030493</dd>
            </div>
            <div className="meta-item">
              <dt>Under the guidance of</dt>
              <dd>Amit Kumar Gupta</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section">
        <h2>What the app does</h2>
        <div className="card">
          <ul className="credits">
            {FEATURES.map(([title, body]) => (
              <li key={title}>
                <b>{title}</b>
                <p>{body}</p>
              </li>
            ))}
          </ul>
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
