import { Link } from 'react-router-dom'

const ITEMS = [
  [
    'Can I trust the verdict?',
    'Treat it as a hint about writing style, not a ruling. The model compares your text to articles it was trained on. It cannot check facts, and it makes mistakes, including on genuine news.',
  ],
  [
    'What does UNCERTAIN mean?',
    'The model\'s confidence was below 55%. At that level its output is no better than a guess, so read it as "no answer".',
  ],
  [
    'Why does it need at least 20 words?',
    'It was trained on full articles. Headlines and single sentences give too little text for a meaningful result. The upper limit is 1,000 words (12,000 characters).',
  ],
  [
    'Does it work in other languages?',
    'No. It was trained on English-language articles only.',
  ],
  [
    'Why was a genuine article marked FAKE?',
    'The training data leans towards US and Reuters-style reporting, so news written in other styles or about other regions can fall outside what the model learned. The "Known limitation" sample on the Analyze page shows this.',
  ],
  [
    'What do the highlighted words mean?',
    'They are words from your text that pushed the score most, based on how common the word is in your text and how strongly the model links it to fake or real articles. They are evidence for this result, not proof that a word is "suspicious".',
  ],
  [
    'Is my text stored?',
    'It is sent to the server to be scored and is not saved or logged. Your history stays in your open tab only. If you leave feedback, only your rating, comment and the model’s verdict are saved, never the article. See the Terms & Privacy page for details.',
  ],
  [
    'Why did I get a "too many requests" message?',
    'The server limits how often one device can send requests, to keep the demo available for everyone. Wait a minute and try again.',
  ],
]

export default function Faq() {
  return (
    <article className="prose">
      <div className="page-head">
        <h1>FAQ</h1>
        <p>Short answers to common questions about the detector.</p>
      </div>
      <div className="faq">
        {ITEMS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <p className="diagram-caption">
        More detail: <Link to="/model">how the model was evaluated</Link>,{' '}
        <Link to="/about">about the project</Link>,{' '}
        <Link to="/terms">terms &amp; privacy</Link>.
      </p>
    </article>
  )
}
