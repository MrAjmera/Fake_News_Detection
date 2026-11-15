import os
import re
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

import inference
import url_fetch
from schemas import (
    ExtractUrlRequest,
    ExtractUrlResponse,
    FeedbackRequest,
    FeedbackResponse,
    HealthResponse,
    ModelInfoResponse,
    PredictRequest,
    PredictResponse,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
VIZ_DIR = REPO_ROOT / "visualizations"
DIST_DIR = REPO_ROOT / "frontend" / "dist"

# --- configuration (see .env.example) ---------------------------------------
# Comma-separated list of browser origins allowed to call the API.
FRONTEND_ORIGINS = [
    o.strip()
    for o in os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
    if o.strip()
]
PREDICT_RATE_LIMIT = os.environ.get("PREDICT_RATE_LIMIT", "30/minute")
FEEDBACK_RATE_LIMIT = os.environ.get("FEEDBACK_RATE_LIMIT", "20/minute")
URL_RATE_LIMIT = os.environ.get("URL_RATE_LIMIT", "10/minute")
# Thumbs up/down and comments are appended here, one line each. The file holds
# user comments, so it is git-ignored. Article text is never written to it.
FEEDBACK_FILE = Path(os.environ.get("FEEDBACK_FILE", REPO_ROOT / "feedback.txt"))
_feedback_lock = threading.Lock()
_CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]+")
# Requests larger than this are refused before the body is read into memory.
MAX_BODY_BYTES = 64 * 1024

# CSP for the built single-page app. Only same-origin scripts and styles are
# allowed; nothing inline. React sets style props through the DOM, which this
# policy permits.
APP_CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self'; "
    "img-src 'self' data:; "
    "connect-src 'self'; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "form-action 'self'; "
    "frame-ancestors 'none'"
)
# JSON API responses never need to load anything.
API_CSP = "default-src 'none'; frame-ancestors 'none'"
# FastAPI's interactive docs load assets from a CDN, so they are exempt.
CSP_EXEMPT_PREFIXES = ("/docs", "/redoc")

MODEL_INFO = {
    "model_type": "TF-IDF + Logistic Regression (V2)",
    "accuracy": {
        "naive_bayes": 86.09,
        "logistic_regression": 95.14,
        "random_forest": 95.61,
        "weighted_ensemble": 94.50,
    },
    "feature_count": 15000,
    "ngram_range": [1, 2],
    "training_corpora": ["ISOT", "WELFake", "fake_3", "CoAID"],
    "deduplication_note": (
        "~60,000 duplicated entries were dropped during ingestion to prevent "
        "data leakage between overlapping datasets (e.g. WELFake vs. ISOT)."
    ),
}

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    inference.load_artifacts()
    yield


app = FastAPI(title="Fake News Detection API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # FastAPI's default 422 body echoes the submitted input back. Return a fixed
    # message instead so user text never appears in responses or error logs.
    if request.url.path == "/api/extract-url":
        detail = "Invalid request. Send JSON like {\"url\": \"https://...\"}."
    elif request.url.path == "/api/feedback":
        detail = (
            "Invalid feedback. Send a rating of \"up\" or \"down\" and a comment "
            "of at most 500 characters."
        )
    else:
        detail = (
            "Invalid request. Send JSON like {\"text\": \"...\"} with at most "
            "12,000 characters."
        )
    return JSONResponse(status_code=422, content={"detail": detail})


# No credentials/cookies are used, so credentialed CORS is not enabled.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        response = JSONResponse(
            status_code=413, content={"detail": "Request body too large."}
        )
    else:
        response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"
    if not request.url.path.startswith(CSP_EXEMPT_PREFIXES):
        is_api = request.url.path.startswith("/api/")
        response.headers["Content-Security-Policy"] = API_CSP if is_api else APP_CSP
    return response


if VIZ_DIR.exists():
    app.mount("/static/viz", StaticFiles(directory=VIZ_DIR), name="viz")


@app.get("/api/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "model_loaded": inference.is_loaded()}


@app.get("/api/model-info", response_model=ModelInfoResponse)
def model_info():
    return MODEL_INFO


@app.post("/api/predict", response_model=PredictResponse)
@limiter.limit(PREDICT_RATE_LIMIT)
def predict(request: Request, body: PredictRequest):
    try:
        return inference.predict(body.text)
    except inference.ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/extract-url", response_model=ExtractUrlResponse)
@limiter.limit(URL_RATE_LIMIT)
def extract_url(request: Request, body: ExtractUrlRequest):
    """Fetch a public news page and return only its article text (nothing is stored)."""
    try:
        return url_fetch.extract_from_url(body.url)
    except url_fetch.UrlError as e:
        raise HTTPException(status_code=e.status, detail=str(e))


@app.post("/api/feedback", response_model=FeedbackResponse)
@limiter.limit(FEEDBACK_RATE_LIMIT)
def feedback(request: Request, body: FeedbackRequest):
    """Append one line to feedback.txt: time, rating, the model's verdict, comment."""
    when = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    rating = "THUMBS UP" if body.rating == "up" else "THUMBS DOWN"
    verdict = body.verdict or "-"
    if body.confidence is not None:
        verdict += f" {body.confidence:.2f}%"
    if body.confidence_band:
        verdict += f" ({body.confidence_band})"
    # One entry = one line, so a comment can never fake extra entries.
    comment = _CONTROL_CHARS.sub(" ", body.comment).strip() or "-"
    line = f"{when} | {rating} | model said: {verdict} | comment: {comment}\n"
    try:
        with _feedback_lock:
            FEEDBACK_FILE.parent.mkdir(parents=True, exist_ok=True)
            with FEEDBACK_FILE.open("a", encoding="utf-8") as f:
                f.write(line)
    except OSError:
        raise HTTPException(status_code=500, detail="Could not save feedback.")
    return {"saved": True}


# --- serve the built frontend (only when `npm run build` has been run) -------
# In development the Vite dev server serves the UI and proxies /api here.
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found.")
        candidate = (DIST_DIR / path).resolve()
        if candidate.is_file() and DIST_DIR.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")
