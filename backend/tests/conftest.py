import os

# Must be set before `main` is imported: the limit is read at import time.
os.environ["PREDICT_RATE_LIMIT"] = "5/minute"

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture(scope="session")
def client():
    # The context manager runs the lifespan, which loads the real V2 model.
    with TestClient(main.app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_rate_limit():
    main.limiter.reset()
    yield


@pytest.fixture(autouse=True)
def feedback_file(tmp_path, monkeypatch):
    # Tests must never write to the real feedback.txt.
    path = tmp_path / "feedback.txt"
    monkeypatch.setattr(main, "FEEDBACK_FILE", path)
    return path
