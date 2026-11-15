# Changes: Phase 1 (frontend product layer)

Branch: `feat/frontend-product-layer`. Frontend only. The ML model, the backend and the `/api/predict` response format are untouched.

## The demo story this supports
Paste an article, see the verdict and why, then understand how the model was built and tested.

## Files, and why each was touched

### Look and feel (design tokens, dark mode, mobile)
- `frontend/src/index.css`: Colours, spacing and text sizes are now CSS variables. Added a dark palette that follows the computer's setting until the user picks one. Text colours were darkened so they pass the accessibility contrast rule. Animations switch off for users who ask for reduced motion. Layout works down to 360px wide. All new styles for the features below are appended here.
- `frontend/index.html`: Real page title, description and share (Open Graph) tags. The old tag that forced dark colours was corrected.
- `frontend/public/favicon.svg`: The default Vite logo was replaced with a simple project icon.
- `frontend/src/lib/theme.js`, `components/ThemeToggle.jsx`: Light/dark toggle. Remembers the choice, and follows the OS until a choice is made.
- `frontend/src/main.jsx`: Applies the theme before the first paint and wraps the app in the consent and toast providers.

### Pages and navigation
- `frontend/src/App.jsx`: Page layout with proper landmarks (header, main, footer), a "skip to content" link, focus moved to the page on navigation, new routes. **Analyze moved from `/` to `/analyze`.**
- `frontend/src/pages/Landing.jsx`: New home page: hero, 3-step "How it works", honest limitations strip, "Try the detector" buttons.
- `frontend/src/pages/Terms.jsx`: Terms & Privacy (academic project, no professional advice, data handling, 18+).
- `frontend/src/pages/About.jsx`: Project, team, stack, V1-to-V2 story in four points, dataset credits.

### Consent and privacy
- `frontend/src/lib/storage.js`: One safe wrapper for browser storage. Every access is guarded, and every key shares one prefix.
- `frontend/src/lib/consent.jsx`: Remembers consent. "Clear my data" removes everything this app stored and resets the Analyze page.
- `frontend/src/components/ConsentModal.jsx`: First-visit notice using the browser's built-in dialog (keyboard focus is trapped, Esc does not dismiss it). It is hidden on `/terms` so people can read the terms first.

### Analyze page
- `frontend/src/pages/Analyze.jsx`: Labelled text box, live word counter with a progress bar to the 20-word minimum, loading skeleton, empty state, error state with "Try again", clear text and clear history, resets on "Clear my data".
- `frontend/src/components/ApiStatus.jsx`: Server status badge from `/api/health`, rechecked every 30 seconds.
- `frontend/src/lib/toast.jsx`: Small pop-up notifications.
- `frontend/src/components/ResultActions.jsx`, `lib/resultActions.js`: Copy result, Export JSON.
- `frontend/src/data/samples.js`: Added a satire sample. It was tested against the live model first: FAKE in all 5 variants (69–79% confidence), so it is kept with an honest note.

### Result visuals
- `frontend/src/components/ConfidenceGauge.jsx`, `ResultCard.jsx`: Animated semicircle gauge replaces the bar. Also removed a lint warning in the old component.
- `frontend/src/lib/highlight.js`, `components/HighlightedText.jsx`: Marks the API's influential terms inside the submitted text. Matching ignores case, escapes special characters, handles two-word terms across punctuation, picks the stronger term when two overlap, and lists any term that cannot be found. The text is drawn as plain text, never as HTML.

### Model page
- `frontend/src/data/metrics.json`: The numbers you will replace. Marked `is_sample: true`.
- `frontend/src/lib/metrics.js`: Works out precision, recall, F1 and accuracy from the confusion matrix, so the table and heatmap always agree.
- `frontend/src/components/EvaluationSection.jsx`, `pages/Model.jsx`: Metrics table and confusion-matrix heatmap. A visible **"Sample data"** banner shows until `is_sample` is set to `false`. This replaced the hard-coded Logistic Regression table; the Random Forest reference table is unchanged.

### Feedback
- `frontend/src/lib/feedbackStore.js`: Stores feedback behind two functions, `save` and `list`. In Phase 2 only this file changes to call an API.
- `frontend/src/components/FeedbackWidget.jsx`: Thumbs up/down, optional comment (500 characters max), "Export feedback (JSON)". Stores rating, comment and the model's label. It does not store the article text.

## What I verified by running the app
- `npm run build` and `npm run lint`: pass, zero warnings.
- Real browser run (Chrome, against the live backend):
  - Consent modal appears first time, Esc does not close it, "I understand" is remembered after reload, and it is hidden on `/terms`.
  - Every internal link works (`/`, `/analyze`, `/model`, `/architecture`, `/about`, `/terms`) and no page is blank. The nav "Analyze" link points to `/analyze` and the landing button lands on `/analyze`.
  - Analyze returns predictions. Counter, samples, gauge, highlighting, copy, history clear, feedback save (no article text stored) and "Clear my data" all work.
  - Dark mode toggle works and follows the OS setting when no choice is stored.
  - No sideways scrolling at 360px on any page. Reduced-motion turns transitions off. No console errors.
- Lighthouse accessibility: Analyze 100 on first visit (modal open). Snapshot audits with a result on screen score 100 in both themes, as do all other pages. Best-practices 100. SEO 90 (only failure: `robots.txt`, which is a deployment matter).

## What I could not verify
- Real phone hardware and Safari/Firefox (only Chrome tested).
- A screen reader (only automated checks).
- The Open Graph share preview: no share image exists, and no public URL is set.
- `metrics.json` numbers are samples (see below).

## Things you need to act on
- **Roll / registration number** is not on the About page. The text you sent was still the placeholder, so I left it out rather than invent one.
- **Dataset licences:** `data/README.md` lists sources but states no licences. The About page therefore says each dataset follows its publisher's licence, and does not name specific licences. Add them if you know them. `fake_3` and CoAID have no source link in the README.
- **Replace `src/data/metrics.json`** with real figures, then set `is_sample` to `false`.
- Note that port 5173 on this machine is used by another project ("route-optimizer"), so I tested on port 5175. The backend CORS setting (`localhost:5173`) is unchanged and is not needed while using the Vite proxy.

---

# Changes: Phase 2 (hardening, tests, resilience)

The ML model and the `/api/predict` response format are still untouched. Same branch.

## Files, and why each was touched

### Backend security
- `backend/main.py`:
  - **Rate limit** on `POST /api/predict` (default 30 per minute per IP, set by `PREDICT_RATE_LIMIT`). Extra requests get HTTP 429.
  - **CORS** now allows only the configured frontend origin (`FRONTEND_ORIGIN`, default `http://localhost:5173`), only GET/POST, and no cookies.
  - **Security headers** on every response: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`. The page policy allows only same-origin scripts and styles. The `/docs` pages are exempt because they load assets from a CDN.
  - **Size guard:** bodies over 64 KB are refused with 413 before being read.
  - **No user text in responses or logs:** the default validation error repeats the submitted text back, so it is replaced with a fixed message. The app has no logging or print calls anywhere.
  - **Serves the built frontend** from `frontend/dist` when it exists, so the production-style app and its CSP can be tested on one port. Without a build, nothing changes (development still uses the Vite server).
- `backend/schemas.py`: the request text is capped at 12,000 characters.
- `backend/requirements.txt`: added `slowapi`.
- `backend/requirements-dev.txt` (new): `pytest`, `httpx` (needed by FastAPI's test client), `pip-audit`.
- `.env.example` (new): documents the two settings. No secrets exist or are needed.

### Tests
- `backend/tests/test_api.py`, `conftest.py`, `backend/pytest.ini`: 6 tests: a normal prediction, too-short text, over-limit text (checks the text is not echoed), the rate limit, security headers, and the CORS allowlist. They use the real model.

### Frontend
- `frontend/src/api/client.js`, `pages/Analyze.jsx`: the same 12,000-character cap in the UI (the counter says how far over you are), plus plain messages for "too many requests" and "too large".
- `frontend/src/components/ErrorBoundary.jsx`: a friendly screen instead of a blank page if a component crashes.
- `frontend/src/pages/NotFound.jsx`: 404 page. `frontend/src/pages/Faq.jsx`: FAQ (linked from the footer).
- `frontend/src/App.jsx`, `index.css`: wiring for the above. No `dangerouslySetInnerHTML` is used anywhere in the code.

## Audit results (reported only, nothing upgraded)
- **npm audit:** 2 high-severity findings, both through the dev tool Vite 8.3.0–8.3.2 (its dev server and the `launch-editor` helper). They affect the development server, not the built site. `npm audit fix` offers a fix within the same major version; I did not apply it. Say the word and I will.
- **pip-audit:** 12 entries, all for `pip` itself (installer tooling), none for the app's libraries (fixed in pip 26.2).
- **Not a vulnerability, but worth knowing:** the saved model was created with scikit-learn 1.7.0 and the virtual environment has 1.9.1, so loading it prints a version warning. Predictions work, and the tests pass. Pinning scikit-learn to 1.7.0 in `requirements.txt` would remove the warning; I did not change it.

## What I verified by running it
- `pytest`: 6 passed. `npm run build` and `npm run lint`: pass with no warnings.
- curl against the running backend: security headers present on API and page responses; unknown `/api/...` path gives a JSON 404 and other unknown paths serve the app (which shows the 404 page); a disallowed origin gets no CORS header and the allowed one does; too-short text gives the clear message; 17,000-character text gives 422 with no echo of the text; a 70 KB body gives 413; the backend's own output contained none of the submitted text.
- Browser check of the **built** app under the new CSP: zero CSP violations and no console or network errors. Home, Analyze (real prediction, gauge, highlighting), Model, Architecture (all 3 diagrams), FAQ, About and the 404 page rendered. Dark-mode toggle worked.

## What I did not verify
- The rate-limit 429 message in the browser (covered by the automated test only).
- Behaviour behind a real reverse proxy: all users behind one proxy would share one IP and one rate-limit bucket unless the proxy forwards the client address.
- Full Lighthouse was not re-run, as agreed.

## Things you need to act on
- **Roll number:** your message again contained the literal text `<your roll number>`. Send the real number and I will add it to the About page.
- Production use: set `FRONTEND_ORIGIN` to the real site address, and install dev tools with `pip install -r backend/requirements-dev.txt`.

---

# Changes: Follow-up (dependency fixes and documentation)

## Files, and why each was touched
- `frontend/package-lock.json`: ran `npm audit fix` (no `--force`). Vite moved from 8.3.0 to 8.3.8 and the bundler pieces it depends on moved to newer releases of the same major version. `package.json` is unchanged. This resolves the 2 high-severity findings reported in Phase 2; `npm audit` now reports 0 vulnerabilities.
- `backend/requirements.txt`: `scikit-learn` is now pinned to `==1.7.0`, the version the saved model was created with. This removes the version warning shown when the model loaded.
- `README.md`: rewritten. The old text described the V1 Random Forest command-line tool; it now describes V2, the API (endpoints, request/response, limits and errors), the UI, security, configuration, tests, training, project structure and limitations, and how to start everything. After a one-time `npm run build`, one command (`uvicorn main:app`) serves the API and the UI together on port 8000.
- `DEMO.md` (new): a step-by-step demo script, three sample inputs with their expected results, and a short fix-it table.
- `CHANGES.md`: this section.

## What I verified by running it
- `npm audit`: 0 vulnerabilities. `npm run build` and `npm run lint`: pass. `pytest`: 6 passed.
- scikit-learn 1.7.0 installed in the backend environment; the model loads and predicts with Python warnings treated as errors, so no version warning is raised. Backend startup output contained no warnings. Predictions are unchanged (for example the fake sample is still FAKE at 99.63%).
- I ran the demo path in a real browser against the backend serving the built app: first-visit notice, Home button to Analyze, "Server online" badge, and the Fake, Real, Known-limitation and Satire samples. All four results matched the figures written in `DEMO.md` exactly. A 10-word input keeps the Analyze button disabled. The Model page shows the "Sample data" banner.
- I stopped only the backend process I started, by its process number, and removed my log files.

## What I did not verify
- The README's macOS/Linux commands (only Windows was run), and the training steps (`train_v2.py` needs the datasets, which are not in the repository).
- The 2 remaining pytest warnings are about Starlette's test client and a Python library alias; they are unrelated to this project's code.

## Things to know
- **Roll number is still not on the About page.** The text sent was again a placeholder (`2XXXXXXXXXX [replace with your real number]`). Send the actual number.
- **The "Feature importance" chart on the Model page is from V1.** `src/visualize.py` reads the V1 Random Forest in `models/`, so `visualizations/feature_importance.png` shows V1's top words, while the page describes V2. Either regenerate it from the V2 model or change its caption.
- **Replace `frontend/src/data/metrics.json` before the demo.** The "Sample data" banner stays until `is_sample` is `false`.
- Nothing has been merged to `main`.
