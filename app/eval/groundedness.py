"""M9.8 deterministic groundedness — design_doc §9.16.

Every price, URL, percentage and GPU SKU an answer states must appear **verbatim** in the
facts that answer was retrieved from. A hard fail, not a score: there is no acceptable rate
at which a competitor-intelligence tool invents a rate card.

Deliberately not an LLM judge. A judge introduces the failure mode it is meant to catch —
§7.0 already measured a model agreeing with whatever it was asked — and it cannot be run in
CI on every commit. String containment can, costs nothing, and is not wrong in a way that
requires interpretation.

**What this does not catch**, stated so the guarantee is not overclaimed: an answer that
recombines two real numbers into a false relationship ("Nebius is cheaper than RunPod") uses
no unsupported token and passes. That is a claim-level check, deferred to M9.10. This catches
fabricated *values*, which is the failure that actually appears in practice.
"""

import re
from typing import Any, Dict, List

# Extracted because a model cannot know these unless retrieval supplied them.
_PATTERNS = {
    "url":        re.compile(r"https?://[^\s\)\]\"'>,]+"),
    "currency":   re.compile(r"[₹$€£]\s?\d[\d,]*(?:\.\d+)?"),
    "rate":       re.compile(r"\d[\d,]*(?:\.\d+)?\s*/\s*(?:hr|hour|mo|month|yr|year)", re.I),
    "percentage": re.compile(r"\d+(?:\.\d+)?\s?%"),
    "gpu_sku":    re.compile(r"\b(?:B200|GB200|GB300|H100|H200|A100|L40S?|HGX|RTX\s?\d{4})\b", re.I),
    "year":       re.compile(r"\b(?:19|20)\d{2}\b"),
}


def _normalise(text: str) -> str:
    """Collapse whitespace and case so '$1.99 /hr' matches '$1.99/hr'."""
    return re.sub(r"\s+", "", (text or "").lower())


def extract_claims(answer: str) -> List[Dict[str, str]]:
    """Every checkable token in an answer, tagged by what kind of thing it is."""
    claims = []
    seen = set()
    for kind, pattern in _PATTERNS.items():
        for match in pattern.findall(answer or ""):
            value = match if isinstance(match, str) else match[0]
            key = (kind, _normalise(value))
            if key not in seen:
                seen.add(key)
                claims.append({"kind": kind, "value": value.strip()})
    return claims


def check(answer: str, facts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Is every checkable token in `answer` present in `facts`?

    Returns `grounded: False` with the offending tokens listed, so a failure names what was
    invented rather than only that something was.
    """
    haystack = _normalise(" ".join(
        f"{f.get('content', '')} {f.get('source_url') or ''}" for f in (facts or [])
    ))
    claims = extract_claims(answer)
    unsupported = [c for c in claims if _normalise(c["value"]) not in haystack]
    return {
        "grounded": not unsupported,
        "checked": len(claims),
        "unsupported": unsupported,
        # An answer with nothing checkable is vacuously grounded. Flagged so a wall of
        # confident prose with no verifiable token is not mistaken for a clean pass.
        "vacuous": len(claims) == 0,
    }


if __name__ == "__main__":
    facts = [{"content": "Empirical Pricing & Rate Card Terms: $1.99/hr.",
              "source_url": "https://www.voltagepark.com/"}]

    ok = check("Voltage Park lists $1.99/hr (https://www.voltagepark.com/).", facts)
    assert ok["grounded"] and ok["checked"] >= 2, ok

    bad = check("Voltage Park lists $1.49/hr on H100 hardware.", facts)
    assert not bad["grounded"], bad
    assert {c["value"] for c in bad["unsupported"]} >= {"$1.49"}, bad["unsupported"]

    assert check("They are positioned as a premium provider.", facts)["vacuous"]
    print("groundedness.py self-check OK")
