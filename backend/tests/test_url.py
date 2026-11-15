"""URL input: SSRF safety rules and the /api/extract-url endpoint (no real network)."""

import pytest

import url_fetch

PUBLIC_IP = "93.184.216.34"


@pytest.fixture
def public_dns(monkeypatch):
    """Make every hostname resolve to a public address."""
    def fake(host, *args, **kwargs):
        return [(2, 1, 6, "", (PUBLIC_IP, 0))]
    monkeypatch.setattr(url_fetch.socket, "getaddrinfo", fake)


def article_html(words: int) -> bytes:
    vocab = (
        "council minister budget report policy school health transport energy "
        "committee statement region officials review proposal funding election "
        "district hospital railway farmers market inflation housing safety"
    ).split()
    paragraphs = []
    n = 0
    while n < words:
        sentence = " ".join(vocab[(n + k * 7) % len(vocab)] + ("" if k % 9 else ",") for k in range(12))
        sentence = f"{sentence} number {n}."
        paragraphs.append(f"<p>{sentence} " + sentence.replace("number", "figure") + "</p>")
        n += 24
    body = "\n".join(paragraphs)
    return (
        "<html><head><title>City council approves new budget</title></head><body>"
        "<nav><a href='/'>Home</a> <a href='/about'>About</a></nav>"
        f"<article><h1>City council approves new budget</h1>{body}</article>"
        "<footer>Copyright notice and links</footer></body></html>"
    ).encode()


# --- the safety rules ---------------------------------------------------------


@pytest.mark.parametrize(
    "bad_url",
    [
        "file:///etc/passwd",
        "ftp://example.com/file",
        "javascript:alert(1)",
        "http://127.0.0.1/",
        "http://localhost/",
        "http://localhost:8000/api/health",
        "http://10.0.0.5/admin",
        "http://192.168.1.1/",
        "http://172.16.0.1/",
        "http://169.254.169.254/latest/meta-data/",
        "http://[::1]/",
        "http://[::ffff:127.0.0.1]/",
        "http://0.0.0.0/",
        "https://user:pass@example.com/",
        "https://example.com:8080/",
        "not a link",
        "",
    ],
)
def test_unsafe_links_are_refused(bad_url, monkeypatch):
    # Hostnames must never reach the network in this test.
    monkeypatch.setattr(
        url_fetch, "fetch_page", lambda u: pytest.fail("must not fetch " + u)
    )
    with pytest.raises(url_fetch.UrlError) as e:
        url_fetch.extract_from_url(bad_url)
    assert e.value.status == 400


def test_public_link_is_accepted(public_dns):
    assert url_fetch.validate_url("https://news.example.com/story") == "https://news.example.com/story"


def test_hostname_that_resolves_to_private_address_is_refused(monkeypatch):
    monkeypatch.setattr(
        url_fetch.socket,
        "getaddrinfo",
        lambda *a, **k: [(2, 1, 6, "", ("10.1.2.3", 0))],
    )
    with pytest.raises(url_fetch.UrlError):
        url_fetch.validate_url("https://sneaky.example.com/")


def test_redirect_to_internal_address_is_refused(public_dns, monkeypatch):
    # First hop is public, but it redirects to the cloud metadata address.
    import httpx

    def handler(request):
        return httpx.Response(302, headers={"location": "http://169.254.169.254/latest/"})

    real_client = httpx.Client
    monkeypatch.setattr(
        url_fetch.httpx,
        "Client",
        lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw),
    )
    # The metadata address is a literal IP, so it fails the public check for real.
    monkeypatch.setattr(
        url_fetch.socket,
        "getaddrinfo",
        lambda host, *a, **k: [(2, 1, 6, "", ("169.254.169.254" if host == "169.254.169.254" else PUBLIC_IP, 0))],
    )
    with pytest.raises(url_fetch.UrlError) as e:
        url_fetch.fetch_page("https://news.example.com/go")
    assert "not a public website" in str(e.value)


def test_too_large_and_non_html_pages_are_refused(public_dns, monkeypatch):
    import httpx

    real_client = httpx.Client  # capture before it is patched

    def run(response):
        monkeypatch.setattr(
            url_fetch.httpx,
            "Client",
            lambda **kw: real_client(transport=httpx.MockTransport(lambda r: response), **kw),
        )
        return url_fetch.fetch_page("https://news.example.com/x")

    with pytest.raises(url_fetch.UrlError) as e:
        run(httpx.Response(200, headers={"content-type": "application/pdf"}, content=b"%PDF"))
    assert e.value.status == 422

    with pytest.raises(url_fetch.UrlError) as e:
        run(httpx.Response(200, headers={"content-type": "text/html"}, content=b"x" * (url_fetch.MAX_BYTES + 10)))
    assert e.value.status == 413

    with pytest.raises(url_fetch.UrlError) as e:
        run(httpx.Response(403, headers={"content-type": "text/html"}, content=b"no"))
    assert e.value.status == 502


# --- the endpoint -------------------------------------------------------------


def test_endpoint_returns_article_text(client, public_dns, monkeypatch):
    monkeypatch.setattr(url_fetch, "fetch_page", lambda u: article_html(300))
    r = client.post("/api/extract-url", json={"url": "https://news.example.com/story"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "news.example.com"
    assert body["title"] == "City council approves new budget"
    assert body["word_count"] >= 20
    assert "Copyright notice" not in body["text"]  # footer boilerplate is dropped
    assert body["truncated"] is False


def test_endpoint_cuts_long_articles_to_the_model_limit(client, public_dns, monkeypatch):
    monkeypatch.setattr(url_fetch, "fetch_page", lambda u: article_html(2000))
    r = client.post("/api/extract-url", json={"url": "https://news.example.com/long"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["truncated"] is True
    assert body["word_count"] <= 1000
    assert len(body["text"]) <= 12_000


def test_endpoint_page_without_article_text(client, public_dns, monkeypatch):
    monkeypatch.setattr(url_fetch, "fetch_page", lambda u: b"<html><body><p>Hi</p></body></html>")
    r = client.post("/api/extract-url", json={"url": "https://news.example.com/empty"})
    assert r.status_code == 422
    assert "Not enough article text" in r.json()["detail"]


def test_endpoint_refuses_internal_link_and_bad_body(client):
    r = client.post("/api/extract-url", json={"url": "http://127.0.0.1:8000/api/health"})
    assert r.status_code == 400
    assert client.post("/api/extract-url", json={}).status_code == 422
    assert client.post("/api/extract-url", json={"url": "x" * 3000}).status_code == 422


def test_endpoint_is_rate_limited(client):
    codes = [
        client.post("/api/extract-url", json={"url": "http://127.0.0.1/"}).status_code
        for _ in range(12)
    ]
    assert codes[:10] == [400] * 10
    assert 429 in codes[10:]
