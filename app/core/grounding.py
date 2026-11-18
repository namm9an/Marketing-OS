"""Eligibility for the crawled evidence corpus; this does not prove claim entailment."""

from urllib.parse import urlsplit


def is_grounded_source(creator, source_url) -> bool:
    if creator != "grounded_crawler" or not isinstance(source_url, str):
        return False
    if not source_url or any(ch.isspace() or ord(ch) < 32 for ch in source_url):
        return False
    try:
        parsed = urlsplit(source_url)
        # Evaluating port also rejects malformed/non-numeric port values.
        port = parsed.port
        return bool(
            parsed.scheme in ("http", "https") and parsed.hostname
            and parsed.username is None and parsed.password is None
            and (port is None or 0 < port <= 65535)
        )
    except ValueError:
        return False
