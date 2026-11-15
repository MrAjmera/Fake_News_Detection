# Demo script (about 7 minutes)

**Story:** paste an article → see the verdict and why → understand how the model was built and evaluated.

## Before the panel arrives

1. **Replace the sample numbers.** The Model page shows a "Sample data" banner until `frontend/src/data/metrics.json` holds your real evaluation results and `"is_sample"` is `false`. Do this first, or say out loud that those figures are placeholders.
2. Build once and start (PowerShell, from the repo root):
   ```powershell
   cd frontend; npm run build; cd ../backend
   venv\Scripts\activate
   python -m uvicorn main:app --port 8000
   ```
3. Open **http://127.0.0.1:8000** in a fresh browser window. The first-visit notice appears; keep it for the demo, it is a feature (step 1 below).
4. Keep a second tab on `/analyze` ready. To reset between runs, click **Clear my data** in the footer.

## Walkthrough

| # | Do | Say |
|---|----|-----|
| 1 | Open the home page. Read the headline, point at the three steps and the limitations strip. Click **Try the detector**; accept the notice ("I understand"). | "Before anything: it is English-only, a probability not a verdict, and not a fact-checker. The notice tells users what is stored locally; nothing about their text is saved." |
| 2 | On Analyze, note the green **Server online** badge. Click **Fake sample**, then **Analyze**. | "36 words. The staged animation mirrors the real pipeline: cleaning, TF-IDF, logistic weights, confidence." |
| 3 | Show the result: the verdict, the gauge, the REAL/FAKE split. Scroll to **Why this verdict** and **Your text, annotated**. | "Each word is from this article. The bar is its TF-IDF score times the model's coefficient, so this is evidence from the text, not a generic word list." |
| 4 | Click **Real sample**, then **Analyze**. | "A Reuters-style article reads as REAL with high confidence. 'reuters' and 'said' are among the strongest signals." |
| 5 | Click **Known limitation**, then **Analyze**. Read the amber note. | "This is a genuine Reserve Bank of India report and the model calls it FAKE. The training data is US/Reuters-heavy, so other styles fall outside what it learned. We show this on purpose." |
| 6 | Click **Helpful** or **Not helpful** under a result and save. Click **Copy result** and **Export JSON**. | "Feedback stays in the browser and never includes the article text. It is built so a backend can replace the storage later." |
| 7 | Open **Model**. Walk through accuracy cards, the metrics table, the confusion matrix, and the V1→V2 story. | "V1 stalled at 69%. Three fixes took V2 to about 95%: remove clickbait data, stop mixing unscaled features with TF-IDF, and remove about 60,000 duplicate articles that leaked between train and test." |
| 8 | Open **Architecture**. Show the three diagrams. | "System design, one request end to end including the too-short-text guard rail, and the ML pipeline." |
| 9 | Toggle dark mode. Resize the window narrow. | "Follows the OS setting, works down to phone width, keyboard accessible." |
| 10 | Optional: paste 10 words and press Analyze (the button stays disabled). | "The 20-word minimum is enforced in the UI and again in the API." |

## The three sample inputs

These are the chips on the Analyze page. Results below were produced by the served model; the model is deterministic, so you should see the same figures.

### 1. Fake sample: expected **FAKE, 99.63%, HIGH**
Top signals include `this`, `breaking`, `share`, `share this`.
```text
BREAKING: Scientists discover chocolate cures all diseases! Pharmaceutical companies hate this one weird trick. Doctors are shocked by this miracle cure that Big Pharma doesn't want you to know about. Share this before it gets deleted!
```

### 2. Real sample: expected **REAL, 99.81%, HIGH**
Top signals include `said`, `reuters`, `washington reuters`.
```text
WASHINGTON (Reuters) - The U.S. Commerce Department said on Tuesday that it would extend the deadline for public comment on proposed tariff changes affecting imported steel products. The agency said in a statement that the extension was granted after several industry groups requested additional time to prepare submissions. Officials said the review is part of a routine process and no final decision has been made. A spokesman declined to comment on when the department would issue its findings. Shares of major steel producers were little changed in afternoon trading.
```

### 3. Known limitation (genuine news, wrongly flagged): expected **FAKE, 81.93%, HIGH**
This is the honest-limits example. The article is genuine; the model is wrong because it learned US/Reuters-style reporting.
```text
The Reserve Bank of India announced today that interest rates will remain unchanged at 6.5 percent. The decision was made after reviewing current economic indicators including inflation rates and GDP growth. Financial analysts had predicted this outcome based on recent market trends.
```

*Bonus (the Satire chip):* an invented satirical piece. It reads **FAKE, about 79%** because the model judges writing style only and has no concept of satire.

## If something goes wrong

| Symptom | Fix |
|---------|-----|
| Badge says **Server offline** | The backend is not running, or the port differs. Restart it with the command above. |
| Blank page at `http://127.0.0.1:8000` | `frontend/dist` is missing. Run `npm run build` in `frontend/`, then restart the backend. |
| "Too many requests" message | The demo rate limit is 30 requests a minute. Wait a minute. |
| Backend fails at startup | `models_v2/model_lr_v2.pkl` or `vectorizer_v2.pkl` is missing. Run `python train_v2.py` from `src/`. |
| Notice does not appear again | Click **Clear my data** in the footer. |
