"""Download a news page and pull out the article text, safely.

The server fetches a link that a user typed, so this module is written to stop
SSRF (tricking the server into visiting internal addresses):

  * only http/https, default ports only, no user:password in the link
  * the host must resolve ONLY to public internet addresses (localhost, private
    ranges, link-local and cloud metadata addresses are refused)
  * redirects are followed by hand, at most 3, and every hop is re-checked
  * short timeout, response size cap, HTML content only
  * nothing is stored or logged

Known limit: the address is checked and then httpx resolves the name again to
connect, so a hostile DNS server that changes its answer between the two
lookups (DNS rebinding) is not fully covered. Pinning the connection to the
checked address would close that gap; it is left out to keep the demo simple.
"""

import ipaddress
import re
import socket
from urllib.parse import urljoin, urlsplit

import httpx
import trafilatura

from inference import MAX_WORDS, MIN_WORDS
from schemas import MAX_TEXT_CHARS

MAX_URL_CHARS = 2048
MAX_BYTES = 2 * 1024 * 1024
MAX_REDIRECTS = 3
TIMEOUT = httpx.Timeout(8.0, connect=4.0)
ALLOWED_PORTS = {None, 80, 443}
USER_AGENT = "FakeNewsDetectorDemo/1.0 (academic project)"


class UrlError(Exception):
    """A problem with the link, with a user-friendly message and HTTP status."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _check_public(host: str) -> None:
    try:
        infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except (socket.gaierror, UnicodeError):
        raise UrlError("Could not find that website. Check the link.", 400)

    addresses = {info[4][0] for info in infos}
    if not addresses:
        raise UrlError("Could not find that website. Check the link.", 400)

    for raw in addresses:
        ip = ipaddress.ip_address(raw.split("%")[0])
        if ip.version == 6 and ip.ipv4_mapped is not None:
            ip = ip.ipv4_mapped  # ::ffff:127.0.0.1 is still 127.0.0.1
        if not ip.is_global:
            raise UrlError("That address is not a public website.", 400)


def validate_url(url: str) -> str:
    """Return the cleaned URL, or raise UrlError."""
    url = (url or "").strip()
    if not url or len(url) > MAX_URL_CHARS:
        raise UrlError("Please paste a valid link (up to 2,048 characters).", 400)

    try:
        parts = urlsplit(url)
        port = parts.port
    except ValueError:
        raise UrlError("That does not look like a valid link.", 400)

    if parts.scheme not in ("http", "https"):
        raise UrlError("Only http and https links are supported.", 400)
    if not parts.hostname:
        raise UrlError("That does not look like a valid link.", 400)
    if parts.username or parts.password:
        raise UrlError("Links with a username or password are not allowed.", 400)
    if port not in ALLOWED_PORTS:
        raise UrlError("Only standard web ports are allowed.", 400)

    _check_public(parts.hostname)
    return url


def fetch_page(url: str) -> bytes:
    """Download the page (bytes), following a few redirects, re-checking each hop."""
    current = url
    with httpx.Client(
        follow_redirects=False,
        timeout=TIMEOUT,
        trust_env=False,  # ignore proxy environment variables
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
    ) as client:
        for _ in range(MAX_REDIRECTS + 1):
            current = validate_url(current)
            try:
                with client.stream("GET", current) as response:
                    if response.is_redirect:
                        location = response.headers.get("location")
                        if not location:
                            raise UrlError("The site sent a broken redirect.", 502)
                        current = urljoin(current, location)
                        continue

                    if response.status_code >= 400:
                        raise UrlError(
                            f"The site answered with an error (HTTP {response.status_code}). "
                            "It may block automated readers or need a login.",
                            502,
                        )
                    if "html" not in response.headers.get("content-type", "").lower():
                        raise UrlError("That link is not a web page with an article.", 422)

                    declared = response.headers.get("content-length", "")
                    if declared.isdigit() and int(declared) > MAX_BYTES:
                        raise UrlError("That page is too large to read.", 413)

                    chunks, total = [], 0
                    for chunk in response.iter_bytes():
                        total += len(chunk)
                        if total > MAX_BYTES:
                            raise UrlError("That page is too large to read.", 413)
                        chunks.append(chunk)
                    return b"".join(chunks)
            except httpx.TimeoutException:
                raise UrlError("The site took too long to respond.", 504)
            except httpx.HTTPError:
                raise UrlError("Could not download that page.", 502)
    raise UrlError("The link redirected too many times.", 502)


def _cut_words(text: str, limit: int) -> str:
    """Keep the first `limit` words, preserving the original spacing."""
    for i, match in enumerate(re.finditer(r"\S+", text), start=1):
        if i == limit:
            return text[: match.end()]
    return text


def extract_article(page: bytes) -> tuple[str | None, str]:
    try:
        text = trafilatura.extract(
            page,
            include_comments=False,
            include_tables=False,
            favor_precision=True,
            deduplicate=True,
        )
        meta = trafilatura.extract_metadata(page)
        title = (meta.title or "").strip() if meta else ""
    except Exception:  # extraction libraries can fail on odd markup
        raise UrlError("Could not read the article text from that page.", 422)
    return (title or None), (text or "").strip()


def extract_from_url(url: str) -> dict:
    url = validate_url(url)
    title, text = extract_article(fetch_page(url))

    words = len(text.split())
    if words < MIN_WORDS:
        raise UrlError(
            "Not enough article text was found on that page. It may be behind a "
            "paywall, built with JavaScript, or not a single article. Try pasting "
            "the text instead.",
            422,
        )

    truncated = False
    if words > MAX_WORDS:
        text, truncated = _cut_words(text, MAX_WORDS), True
    if len(text) > MAX_TEXT_CHARS:
        text, truncated = text[:MAX_TEXT_CHARS].rsplit(None, 1)[0], True

    return {
        "title": title,
        "text": text,
        "word_count": len(text.split()),
        "truncated": truncated,
        "source": urlsplit(url).hostname,
    }
