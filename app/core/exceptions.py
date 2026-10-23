"""
Typed Application Exceptions for Provider and Quota Failures
"""

from typing import Optional


class AppException(RuntimeError):
    """Base application exception inheriting from RuntimeError for backward compatibility."""
    status_code: int = 500


class UpstreamProviderError(AppException):
    """Raised when an upstream AI provider (e.g. Gemini) encounters a server error or network failure."""
    def __init__(self, message: str = "Upstream provider error", status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class UpstreamRateLimitError(AppException):
    """Raised when an upstream AI provider rate limit is encountered (HTTP 429)."""
    def __init__(self, message: str = "Upstream rate limit exceeded", retry_after: int = 60):
        super().__init__(message)
        self.message = message
        self.status_code = 429
        self.retry_after = retry_after


class GlobalQuotaExhaustedError(UpstreamRateLimitError):
    """Raised when host-wide daily Gemini call budget has been fully consumed."""
    def __init__(self, message: str = "Global daily Gemini API quota reached", retry_after: int = 60):
        super().__init__(message, retry_after=retry_after)
