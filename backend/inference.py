import time
from pathlib import Path

import joblib
import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = REPO_ROOT / "models_v2" / "model_lr_v2.pkl"
VECTORIZER_PATH = REPO_ROOT / "models_v2" / "vectorizer_v2.pkl"

MIN_WORDS = 20
MAX_WORDS = 1000

_model = None
_vectorizer = None
_feature_names = None


class ModelNotFoundError(RuntimeError):
    pass


def load_artifacts() -> None:
    """Load the trained V2 model and vectorizer once, at app startup."""
    global _model, _vectorizer, _feature_names

    if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
        raise ModelNotFoundError(
            "V2 model artifacts not found. Expected:\n"
            f"  {MODEL_PATH}\n"
            f"  {VECTORIZER_PATH}\n"
            "Run 'python src/train_v2.py' from the repo root to generate them."
        )

    _model = joblib.load(MODEL_PATH)
    _vectorizer = joblib.load(VECTORIZER_PATH)
    _feature_names = _vectorizer.get_feature_names_out()


def is_loaded() -> bool:
    return _model is not None and _vectorizer is not None


class ValidationError(ValueError):
    pass


def validate_text(text: str) -> int:
    """Mirrors src/test.py validate_input(). Returns word count or raises ValidationError."""
    word_count = len(text.strip().split())

    if word_count < MIN_WORDS:
        raise ValidationError(
            "Input too short. This model is trained on full articles — "
            f"please paste at least {MIN_WORDS} words."
        )
    if word_count > MAX_WORDS:
        raise ValidationError(f"Input too long. Please limit to {MAX_WORDS} words.")

    return word_count


def confidence_band(confidence: float) -> str:
    """Mirrors src/test.py interpret_confidence() thresholds."""
    if confidence < 55:
        return "UNCERTAIN"
    if confidence < 75:
        return "LOW"
    return "HIGH"


def predict(text: str) -> dict:
    start = time.perf_counter()

    word_count = validate_text(text)

    # IMPORTANT: train_v2.py vectorizes on text.str.lower() ONLY — no punctuation
    # stripping, no stopword removal. src/test.py additionally strips non-letters
    # and removes stopwords before vectorizing, which is a train/serve mismatch bug
    # in that CLI script. Do NOT "fix" this to match test.py — lowercase-only is
    # what the model was trained on and is what must be served here.
    cleaned = text.lower()

    vectorized = _vectorizer.transform([cleaned])

    prediction = int(_model.predict(vectorized)[0])
    probability = _model.predict_proba(vectorized)[0]
    confidence = float(max(probability) * 100)

    # label mapping: 1 = FAKE, 0 = REAL (see train_v2.py)
    verdict = "FAKE" if prediction == 1 else "REAL"
    band = confidence_band(confidence)

    top_signals = _explain(vectorized)

    latency_ms = (time.perf_counter() - start) * 1000

    return {
        "verdict": verdict,
        "confidence": round(confidence, 2),
        "confidence_band": band,
        "probabilities": {
            "real": round(float(probability[0]) * 100, 2),
            "fake": round(float(probability[1]) * 100, 2),
        },
        "word_count": word_count,
        "top_signals": top_signals,
        "latency_ms": round(latency_ms, 2),
    }


def _explain(vectorized, top_n: int = 6) -> list[dict]:
    """Per-article explainability: contribution of each present TF-IDF term
    towards the prediction, using the LogisticRegression coefficients."""
    coefs = _model.coef_[0]
    row = vectorized.tocsr()[0]
    indices = row.indices
    values = row.data

    contributions = values * coefs[indices]

    fake_mask = contributions > 0
    real_mask = contributions < 0

    fake_idx = indices[fake_mask]
    fake_contrib = contributions[fake_mask]
    real_idx = indices[real_mask]
    real_contrib = contributions[real_mask]

    fake_order = np.argsort(-fake_contrib)[:top_n]
    real_order = np.argsort(real_contrib)[:top_n]  # most negative first

    signals = []
    for i in fake_order:
        signals.append(
            {
                "term": _feature_names[fake_idx[i]],
                "weight": round(float(fake_contrib[i]), 4),
                "direction": "fake",
            }
        )
    for i in real_order:
        signals.append(
            {
                "term": _feature_names[real_idx[i]],
                "weight": round(float(real_contrib[i]), 4),
                "direction": "real",
            }
        )

    signals.sort(key=lambda s: abs(s["weight"]), reverse=True)
    return signals
