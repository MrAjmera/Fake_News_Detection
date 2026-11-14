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
