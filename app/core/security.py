"""
Security Guardrails & Input Sanitization (Enterprise Hardening)
"""

import re
import unicodedata
from typing import Tuple, Optional


# Invisible and zero-width character regex
_INVISIBLE_CHARS_RE = re.compile(
    r"[\u200B-\u200D\uFEFF\u00AD\u2060\u200E\u200F\u202A-\u202E\u180E\uFFF9-\uFFFB]"
)

# Adversarial prompt injection & system override patterns
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"disregard\s+(?:all\s+|any\s+)?(?:previous|prior|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"system\s*prompt\s*override", re.IGNORECASE),
    re.compile(r"override\s+(?:the\s+)?system\s+prompt", re.IGNORECASE),
    re.compile(r"reveal\s+(?:all\s+)?(?:secret\s+)?(?:keys?|api[_\s-]?keys?|passwords?|system\s+prompt)", re.IGNORECASE),
    re.compile(r"(?:show|print|output)\s+(?:the\s+)?(?:system\s+prompt|api[_\s-]?key|secret\s+key)", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+in\s+developer\s+mode", re.IGNORECASE),
    re.compile(r"\bDAN\s+mode\b", re.IGNORECASE),
    re.compile(r"bypass\s+(?:all\s+)?(?:safety|content|security)?\s*(?:filters|rules|restrictions)", re.IGNORECASE),
    re.compile(r"forget\s+(?:everything|all\s+rules)", re.IGNORECASE),
]

MAX_PROMPT_LENGTH = 4000
MAX_PAYLOAD_BYTES = 64 * 1024  # 64 KB


class SecurityError(Exception):
    """Base security exception."""
    status_code: int = 400


class PayloadTooLargeError(SecurityError):
    """Raised when prompt exceeds maximum character limit."""
    status_code: int = 413


class PromptInjectionError(SecurityError):
    """Raised when adversarial prompt injection is detected."""
    status_code: int = 400


# Comprehensive cross-script homoglyph map (Cyrillic, Greek, lookalikes -> Latin)
_HOMOGLYPH_MAP = str.maketrans({
    # Cyrillic lowercase lookalikes
    '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p', '\u0441': 'c',
    '\u0443': 'y', '\u0445': 'x', '\u0456': 'i', '\u0458': 'j', '\u0455': 's',
    '\u0432': 'v', '\u0433': 'g', '\u0434': 'd', '\u0436': 'zh', '\u0437': 'z',
    '\u0438': 'i', '\u0439': 'i', '\u043a': 'k', '\u043b': 'l', '\u043c': 'm',
    '\u043d': 'n', '\u043f': 'p', '\u0442': 't', '\u0444': 'f', '\u0446': 'ts',
    '\u0447': 'ch', '\u0448': 'sh', '\u0449': 'sh', '\u044b': 'y', '\u044d': 'e',
    '\u044e': 'yu', '\u044f': 'ya', '\u0454': 'e', '\u0457': 'i',
    # Cyrillic uppercase lookalikes
    '\u0410': 'A', '\u0412': 'B', '\u0415': 'E', '\u041a': 'K', '\u041c': 'M',
    '\u041d': 'H', '\u041e': 'O', '\u0420': 'P', '\u0421': 'C', '\u0422': 'T',
    '\u0423': 'Y', '\u0425': 'X', '\u0406': 'I', '\u0408': 'J', '\u0405': 'S',
    # Greek lowercase lookalikes
    '\u03b1': 'a', '\u03b2': 'b', '\u03b3': 'y', '\u03b5': 'e', '\u03b7': 'n',
    '\u03b9': 'i', '\u03ba': 'k', '\u03bd': 'v', '\u03bf': 'o', '\u03c1': 'p',
    '\u03c3': 's', '\u03c4': 't', '\u03c5': 'u', '\u03c7': 'x', '\u03c9': 'w',
    # Greek uppercase lookalikes
    '\u0391': 'A', '\u0392': 'B', '\u0395': 'E', '\u0397': 'H', '\u0399': 'I',
    '\u039a': 'K', '\u039c': 'M', '\u039d': 'N', '\u039f': 'O', '\u03a1': 'P',
    '\u03a4': 'T', '\u03a5': 'Y', '\u03a7': 'X',
})


def clean_invisible_characters(text: str) -> str:
    """Strip zero-width spaces and invisible formatting unicode characters."""
    if not text:
        return ""
    return _INVISIBLE_CHARS_RE.sub("", text)


def normalize_homoglyphs(text: str) -> str:
    """Normalize unicode lookalikes and homoglyphs to compatibility decomposed/composed forms."""
    if not text:
        return ""
    nfkc = unicodedata.normalize("NFKC", text)
    return nfkc.translate(_HOMOGLYPH_MAP)


def detect_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    """
    Check for jailbreaks, system prompt overrides, and token extraction attempts.
    Returns (is_detected, matched_pattern_description).
    """
    if not text:
        return False, None

    cleaned = clean_invisible_characters(text)
    normalized = normalize_homoglyphs(cleaned)

    for pattern in _INJECTION_PATTERNS:
        match = pattern.search(normalized)
        if match:
            return True, match.group(0)

    return False, None


def sanitize_prompt(text: str) -> str:
    """
    Sanitize prompt: strip zero-width characters and neutralize detected injection triggers.
    """
    if not text:
        return ""

    cleaned = clean_invisible_characters(text)
    normalized = normalize_homoglyphs(cleaned)

    for pattern in _INJECTION_PATTERNS:
        normalized = pattern.sub("[FILTERED_PROMPT_INJECTION]", normalized)

    return normalized.strip()


def validate_prompt(text: str, max_chars: int = MAX_PROMPT_LENGTH) -> str:
    """
    Enforce boundary rules on prompt strings:
    1. Length limit <= 4000 chars (raises PayloadTooLargeError / 413).
    2. Zero-width character and homoglyph sanitization.
    3. Injection pattern rejection (raises PromptInjectionError / 400).
    """
    if not text:
        return ""

    # Length boundary check
    if len(text) > max_chars:
        raise PayloadTooLargeError(
            f"Prompt exceeds maximum allowed length of {max_chars} characters (received {len(text)})."
        )

    # Invisible character & homoglyph defense
    cleaned = clean_invisible_characters(text)
    normalized = normalize_homoglyphs(cleaned)

    # Injection defense
    is_injection, matched = detect_prompt_injection(normalized)
    if is_injection:
        raise PromptInjectionError(
            f"Adversarial prompt injection pattern detected: '{matched}'"
        )

    return normalized
