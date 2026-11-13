export default function Terms() {
  return (
    <article className="prose">
      <div className="page-head">
        <h1>Terms &amp; Privacy</h1>
        <p>Plain-language terms for using this academic demo.</p>
      </div>

      <section className="section">
        <h2>What this is</h2>
        <p>
          Fake News Detection is a student project built for PBL-1 (CSE2170) at
          Manipal University Jaipur. It is a demonstration of a machine
          learning model, not a commercial product or a public service.
        </p>
      </section>

      <section className="section">
        <h2>What it is not</h2>
        <ul>
          <li>
            It is <b>not a fact-checker</b>. It scores writing patterns, not
            whether claims are true. It can label genuine news as fake and fake
            news as real.
          </li>
          <li>
            Its output is a <b>probability, not a verdict</b>. Treat low
            confidence as &quot;no answer&quot;.
          </li>
          <li>
            It gives <b>no medical, legal, financial or other professional
            advice</b>. Do not make decisions of that kind based on its output.
          </li>
          <li>It only supports English-language text.</li>
        </ul>
      </section>

      <section className="section">
        <h2>Data handling</h2>
        <ul>
          <li>
            <b>Text you analyze</b> is sent to the project&apos;s backend only
            to produce a score. The app does not save it or write it to logs.
          </li>
          <li>
            <b>Stored in your browser</b> (local storage on this device only):
            your answer to the first-visit notice, your light/dark choice, and
            any feedback you choose to leave. Nothing in this list is sent to
            the server.
          </li>
          <li>
            <b>Kept in memory only:</b> your analysis history for the current
            tab. It is gone when you close the tab.
          </li>
          <li>
            There are no accounts, no tracking, no advertising and no
            personal-data collection.
          </li>
          <li>
            Use <b>Clear my data</b> in the footer to delete everything stored
            on this device.
          </li>
        </ul>
      </section>

      <section className="section">
        <h2>Who it is for</h2>
        <p>
          The demo is intended for users aged <b>18 or over</b>. It is provided
          as is, without warranty of any kind. The authors accept no liability
          for any use of, or reliance on, its output.
        </p>
      </section>
    </article>
  )
}
