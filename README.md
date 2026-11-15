# Fake News Detection (V2)

**PBL-1 (CSE2170) · Manipal University Jaipur · Author: Krrish Ajmera**

A web app that estimates whether a news article's writing resembles the fake or the real articles a machine-learning model was trained on. Paste an article, get a verdict, a confidence score, and the exact words in your text that drove the result.

> It is an academic demo, **not a fact-checker**. It reads writing patterns, not facts, and it can be wrong, including on genuine news. English only.

**Demo story:** paste an article → see the verdict and why → understand how the model was built and evaluated. A step-by-step demo script is in [DEMO.md](DEMO.md).

---

## What is in the box

| Part | What it is |
|------|------------|
| **Model (V2)** | TF-IDF (15,000 features, 1–2-grams) + Logistic Regression, trained on ISOT, WELFake, fake_3 and CoAID after removing ~60,000 duplicate articles. Trained by `src/train_v2.py`, saved in `models_v2/`. |
| **API** | FastAPI app in `backend/`. Loads the model once at startup and serves `/api/predict`. |
| **UI** | React + Vite app in `frontend/`: Home, Analyze, Model, Architecture, About, Terms & Privacy, FAQ. |

### Model results (recorded V2 training run)

| Algorithm | Test accuracy |
|-----------|---------------|
| Random Forest | 95.61% (best) |
| **Logistic Regression** | **95.14% (served by the app)** |
| Weighted ensemble | 94.50% |
| Naive Bayes | 86.09% |

Logistic Regression is the model served because it lets the app show *which words in your text pushed the decision*. V1 reached only 69.21%; the jump to V2 came from fixing three pipeline problems: clickbait contamination, unscaled features, and duplicate leakage between datasets. See [V1_to_V2_Engineering_Report.md](docs/archive/2026-04_V2_reports/V1_to_V2_Engineering_Report.md).

> The metrics table and confusion matrix on the **Model** page are driven by `frontend/src/data/metrics.json` and show a visible "Sample data" banner until you replace the numbers with real evaluation results and set `"is_sample": false`.

---

## Quick start

### Prerequisites
- Python 3.10+ and Node.js 18+ with npm
- The trained model files `models_v2/model_lr_v2.pkl` and `models_v2/vectorizer_v2.pkl`. These are not in git (large files). If you don't have them, train them first, see [Training the model](#training-the-model-optional).

### One-time setup (Windows PowerShell; on macOS/Linux use `source venv/bin/activate`)

```powershell
git clone https://github.com/MrAjmera/Fake_News_Detection.git
cd Fake_News_Detection

# backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..

# frontend
cd frontend
npm install
npm run build        # creates frontend/dist
cd ..
```

### Run everything with one command

After the build above, a single process serves both the API and the UI:

```powershell
cd backend
venv\Scripts\activate
python -m uvicorn main:app --port 8000
```

Open **http://127.0.0.1:8000**. The backend serves the built UI from `frontend/dist` and the API under `/api`, with the security headers described below.

If you change the frontend, run `npm run build` again.

### Development mode (hot reload)

Two terminals. The Vite dev server proxies `/api` to the backend.

```powershell
# terminal 1
cd backend; venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000

# terminal 2
cd frontend
npm run dev          # http://localhost:5173
```

If port 5173 is busy, Vite picks the next free port; the proxy keeps working. Only if you call the API directly from a browser on a different origin do you need to set `FRONTEND_ORIGIN` (below).

---

## The API

Base URL: `http://127.0.0.1:8000`

| Method & path | Purpose |
|---------------|---------|
| `GET /api/health` | `{"status": "ok", "model_loaded": true}` |
| `GET /api/model-info` | Model type, accuracies, feature count, corpora, deduplication note |
| `POST /api/predict` | Score one article |
| `POST /api/feedback` | Append a thumbs up/down + comment to `feedback.txt` (never the article text) |

**Request**
```json
{ "text": "Full article text, 20 to 1000 words..." }
```

**Response**
```json
{
  "verdict": "FAKE",
  "confidence": 99.63,
  "confidence_band": "HIGH",
  "probabilities": { "real": 0.37, "fake": 99.63 },
  "word_count": 36,
  "top_signals": [
    { "term": "this", "weight": 0.757, "direction": "fake" }
  ],
  "latency_ms": 12.4
}
```

- `confidence_band`: `UNCERTAIN` below 55% (treat as "no answer"), `LOW` below 75%, otherwise `HIGH`.
- `top_signals`: terms from *your* text, with their contribution (TF-IDF value × model coefficient) and which class they push toward.

**Limits and errors**

| Status | Meaning |
|--------|---------|
| 422 | Fewer than 20 words, more than 1000 words, over 12,000 characters, or a malformed body. The message is fixed text; your input is never echoed back. |
| 413 | Request body larger than 64 KB. |
| 429 | Rate limit exceeded (default 30 requests per minute per IP). |

### Security

- Rate limit on `/api/predict` (slowapi), request size caps, CORS limited to the configured frontend origin (GET/POST only, no cookies).
- Response headers: `Content-Security-Policy` (same-origin scripts and styles only), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
- The app never logs or stores article text. No tracking and no personal-data collection.
- **Feedback file:** each thumbs up/down + optional comment (500 characters max) + the model's verdict is appended as one line to `feedback.txt` in the project root (git-ignored; set `FEEDBACK_FILE` to move it). Comments are flattened to one line so they cannot forge entries. `POST /api/feedback` is rate-limited (`FEEDBACK_RATE_LIMIT`, default 20/minute).
- **Demo sign-in:** one shared id and password checked in the browser (`frontend/src/lib/authConfig.js`; change with `VITE_DEMO_USER` / `VITE_DEMO_PASS` in `frontend/.env.local`, then `npm run build`). It only limits who opens the demo. It is **not real security**, because the values are readable in the built JavaScript. Use real accounts before storing anything sensitive.
- The UI renders text as plain React text nodes and never uses `dangerouslySetInnerHTML`.

### Configuration

Copy `.env.example` to `.env` and edit if needed; nothing here is secret. Load it with `python -m uvicorn main:app --env-file ../.env` (from `backend/`).

| Variable | Default | Meaning |
|----------|---------|---------|
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Comma-separated browser origins allowed to call the API |
| `PREDICT_RATE_LIMIT` | `30/minute` | Rate limit for `POST /api/predict` per IP |

---

## The UI

| Page | What it does |
|------|--------------|
| **Home** (`/`) | What the tool does, 3-step "How it works", honest limitations. |
| **Analyze** (`/analyze`) | Paste an article or load a sample (fake, real, satire, known limitation). Live word counter, API status badge, animated confidence gauge, "why this verdict" signals, your text with influential words highlighted, copy result, export JSON, session history, and a thumbs up/down feedback widget. |
| **Model** (`/model`) | Accuracy comparison, metrics table, confusion-matrix heatmap, V1→V2 story, configuration. |
| **Architecture** (`/architecture`) | Three diagrams: system design, request sequence, ML pipeline. |
| **About, Terms & Privacy, FAQ** | Project and dataset credits; data handling; common questions. Unknown addresses show a 404 page. |

Light and dark themes (follows your OS until you choose), responsive down to 360 px, keyboard accessible, reduced-motion aware. A first-visit notice explains what is stored locally; "Clear my data" in the footer removes everything the app stored in your browser.

What is stored in your browser: your consent answer, theme choice, and any feedback you leave (rating, comment and the model's label, not the article text). Analysis history lives in memory for the open tab only.

---

## Tests and checks

```powershell
# backend (from backend/, venv active)
pip install -r requirements-dev.txt
python -m pytest -q          # 6 tests: prediction, validation, rate limit, headers, CORS

# frontend (from frontend/)
npm run build
npm run lint
npm audit
```

---

## Training the model (optional)

The datasets are not in git; see [data/README.md](data/README.md) for sources and where to place the CSV files (`data/raw/`).

```powershell
pip install -r requirements.txt     # training dependencies (pandas, nltk, ...)
cd src                              # the scripts use ../ paths, so run them from src/
python train_v2.py                  # writes ../models_v2/model_lr_v2.pkl and vectorizer_v2.pkl
```

`src/visualize.py` (also run from `src/`) draws the decision-tree and feature-importance charts from the **V1** Random Forest model in `models/`, not from V2. The Model page shows `visualizations/feature_importance.png` when it exists, so that chart reflects V1.

> The backend pins `scikit-learn==1.7.0` because the saved model was created with that version; loading it with a different version prints a warning. If you retrain with another version, update the pin.

---

## Project structure

```
backend/
  main.py             FastAPI app: routes, rate limit, CORS, security headers, serves frontend/dist
  inference.py        Loads the model once; validation, prediction, per-article explanation
  schemas.py          Request/response models
  tests/              pytest suite
  requirements.txt    runtime dependencies    requirements-dev.txt  test/audit tools
frontend/
  src/pages/          Landing, Analyze, Model, Architecture, About, Terms, Faq, NotFound
  src/components/     ResultCard, ConfidenceGauge, SignalsPanel, HighlightedText, FeedbackWidget, ...
  src/lib/            storage, theme, consent, toast, highlight matching, metrics, feedback store
  src/data/           samples.js, metrics.json
src/                  Training and visualization scripts (train_v2.py is the V2 pipeline)
models_v2/            Trained V2 model + vectorizer (not in git)
data/                 Datasets (not in git) + download instructions
CHANGES.md            Every file changed in the product layer, and why
DEMO.md               Demo script for the panel
```

---

## Limitations

- English only; needs a full article (20 to 1000 words).
- Trained mostly on US / Reuters-style news. Genuine articles in other styles or regions can be marked FAKE, for example the "Known limitation" sample (a genuine Reserve Bank of India report).
- It has no concept of satire; satire is judged on writing style alone.
- The output is a probability about writing style, not a statement about truth.

## Legacy V1 command-line tools

`src/train.py` and `src/test.py` are the original V1 Random Forest scripts (5,000-feature TF-IDF with stop-word removal). They are kept for reference and are not used by the app.

## Credits

Datasets: ISOT Fake News (Fake.csv / True.csv), WELFake, fake_3, CoAID. Each remains the property of its original authors and is used here only for academic model training; see [data/README.md](data/README.md) for sources.

Built with scikit-learn, FastAPI, React and Vite.

## License

Educational project for PBL-1 coursework at Manipal University Jaipur.
