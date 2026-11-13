"""Provider measurements shared by every workflow. Missing measurements stay null."""

from typing import Any, Dict, List

from app.core.config import settings


FIELDS = (
    "latency_ms", "total_wall_ms", "attempts", "prompt_tokens", "completion_tokens",
    "thoughts_tokens", "total_tokens", "source", "model", "requested_model",
    "fallback_used", "finish_reason", "served_model_verified",
)


def provider_metrics(result: Dict[str, Any]) -> Dict[str, Any]:
    metrics = {key: result.get(key) for key in FIELDS}
    metrics.update({
        "total_tokens": result.get("total_tokens", result.get("tokens")),
        "source": result.get("source", "unknown"),
        "model": result.get("model") or result.get("model_used") or "unknown",
        "requested_model": result.get("requested_model", settings.DEFAULT_MODEL),
        "fallback_used": bool(result.get("fallback_used", False)),
        "served_model_verified": bool(result.get("served_model_verified", False)),
    })
    return metrics


def aggregate_metrics(calls: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate counts, never sum latency for parallel calls or invent missing usage."""
    metrics = provider_metrics({})
    metrics["calls"] = calls
    for field in ("attempts", "prompt_tokens", "completion_tokens", "thoughts_tokens", "total_tokens"):
        values = [call.get(field) for call in calls]
        metrics[field] = sum(values) if values and all(v is not None for v in values) else None
    for field in ("source", "model", "requested_model", "finish_reason"):
        values = {call.get(field) for call in calls}
        metrics[field] = next(iter(values)) if len(values) == 1 else "mixed"
    metrics["fallback_used"] = any(c.get("fallback_used") for c in calls)
    metrics["served_model_verified"] = bool(calls) and all(c.get("served_model_verified") for c in calls)
    return metrics


def persistence_metrics(metrics: Dict[str, Any]) -> Dict[str, Any]:
    return {key: metrics.get(key) for key in FIELDS}
