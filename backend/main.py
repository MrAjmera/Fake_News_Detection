from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import inference
from schemas import HealthResponse, ModelInfoResponse, PredictRequest, PredictResponse

REPO_ROOT = Path(__file__).resolve().parent.parent
VIZ_DIR = REPO_ROOT / "visualizations"

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    inference.load_artifacts()
    yield


app = FastAPI(title="Fake News Detection API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if VIZ_DIR.exists():
    app.mount("/static/viz", StaticFiles(directory=VIZ_DIR), name="viz")


@app.get("/api/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "model_loaded": inference.is_loaded()}


@app.get("/api/model-info", response_model=ModelInfoResponse)
def model_info():
    return MODEL_INFO


@app.post("/api/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    try:
        return inference.predict(request.text)
    except inference.ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
