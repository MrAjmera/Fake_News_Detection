from typing import Literal
from pydantic import BaseModel


class PredictRequest(BaseModel):
    text: str


class Probabilities(BaseModel):
    real: float
    fake: float


class Signal(BaseModel):
    term: str
    weight: float
    direction: Literal["real", "fake"]


class PredictResponse(BaseModel):
    verdict: Literal["FAKE", "REAL"]
    confidence: float
    confidence_band: Literal["HIGH", "LOW", "UNCERTAIN"]
    probabilities: Probabilities
    word_count: int
    top_signals: list[Signal]
    latency_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class ModelInfoResponse(BaseModel):
    model_type: str
    accuracy: dict
    feature_count: int
    ngram_range: list[int]
    training_corpora: list[str]
    deduplication_note: str
