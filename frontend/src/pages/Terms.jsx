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
          Fake News Detection is a student project built for PBL-V at
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
            <b>Links you paste</b> are opened by the project&apos;s server, which
            downloads that one public page and keeps only its article text for
            your analysis. Nothing is stored. Private and internal addresses are
            refused.
          </li>
          <li>
            <b>Stored in your browser</b> (local storage on this device):
            your answer to the first-visit notice, your light/dark choice, your
            demo sign-in, and a copy of any feedback you choose to leave.
          </li>
          <li>
            <b>Feedback you submit</b> (thumbs up or down, your optional
            comment, and the model&apos;s verdict and confidence) is sent to the
            server and added to a text file kept by the project team. Your
            article text is never included. Please do not put personal
            information in a comment.
          </li>
          <li>
            <b>Kept in memory only:</b> your analysis history for the current
            tab. It is gone when you close the tab.
          </li>
          <li>
            There is no account system: one shared demo sign-in only limits who
            can open the demo. There is no tracking, no advertising and no
            collection of personal data.
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
