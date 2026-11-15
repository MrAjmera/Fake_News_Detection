ARTICLE = (
    "WASHINGTON (Reuters) - The U.S. Commerce Department said on Tuesday that it "
    "would extend the deadline for public comment on proposed tariff changes "
    "affecting imported steel products. The agency said in a statement that the "
    "extension was granted after several industry groups requested additional time "
    "to prepare submissions."
)


def post(client, text):
    return client.post("/api/predict", json={"text": text})


def test_predict_happy_path(client):
    r = post(client, ARTICLE)
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {
        "verdict",
        "confidence",
        "confidence_band",
        "probabilities",
        "word_count",
        "top_signals",
        "latency_ms",
    }
    assert body["verdict"] in {"FAKE", "REAL"}
    assert body["confidence_band"] in {"HIGH", "LOW", "UNCERTAIN"}
    assert 50 <= body["confidence"] <= 100
    assert abs(body["probabilities"]["real"] + body["probabilities"]["fake"] - 100) < 0.1


def test_predict_too_short_is_rejected(client):
    r = post(client, "far too short to analyse")
    assert r.status_code == 422
    assert "at least 20 words" in r.json()["detail"]


def test_predict_over_char_limit_is_rejected_without_echo(client):
    secret = "SECRET-USER-TEXT "
    r = post(client, secret * 1000)  # ~17,000 chars, over the 12,000 cap
    assert r.status_code == 422
    assert "SECRET-USER-TEXT" not in r.text


def test_predict_rate_limit(client):
    codes = [post(client, ARTICLE).status_code for _ in range(7)]
    assert codes[:5] == [200] * 5
    assert 429 in codes[5:]


def test_security_headers(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["referrer-policy"] == "no-referrer"
    assert "default-src 'none'" in r.headers["content-security-policy"]


def test_cors_only_allows_configured_origin(client):
    ok = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    bad = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-origin" not in bad.headers


# --- feedback: thumbs up/down + comment appended to feedback.txt ------------


def test_feedback_is_appended_as_one_line(client, feedback_file):
    r = client.post(
        "/api/feedback",
        json={
            "rating": "up",
            "comment": "line one\nline two | THUMBS DOWN fake entry",
            "verdict": "FAKE",
            "confidence_band": "HIGH",
            "confidence": 99.63,
        },
    )
    assert r.status_code == 200
    assert r.json() == {"saved": True}

    client.post("/api/feedback", json={"rating": "down"})

    lines = feedback_file.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 2  # a newline in a comment cannot create a third entry
    assert "THUMBS UP" in lines[0]
    assert "model said: FAKE 99.63% (HIGH)" in lines[0]
    assert "line one line two" in lines[0]
    assert "THUMBS DOWN" in lines[1]
    assert lines[1].endswith("comment: -")


def test_feedback_rejects_bad_rating_and_long_comment(client, feedback_file):
    assert client.post("/api/feedback", json={"rating": "meh"}).status_code == 422
    too_long = {"rating": "up", "comment": "x" * 501}
    r = client.post("/api/feedback", json=too_long)
    assert r.status_code == 422
    assert "xxxxx" not in r.text  # the error does not echo the input
    assert not feedback_file.exists()


def test_feedback_never_stores_article_text(client, feedback_file):
    r = client.post(
        "/api/feedback",
        json={"rating": "up", "text": "SECRET-ARTICLE-TEXT " * 30},
    )
    assert r.status_code == 200
    assert "SECRET-ARTICLE-TEXT" not in feedback_file.read_text(encoding="utf-8")
