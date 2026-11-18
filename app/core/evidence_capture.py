"""Optional request-scoped observation for example capture; no API payload changes."""

from contextlib import contextmanager
from contextvars import ContextVar
from copy import deepcopy

_retrievals = ContextVar("example_retrieval_capture", default=None)


@contextmanager
def capture_retrievals():
    records = []
    token = _retrievals.set(records)
    try:
        yield records
    finally:
        _retrievals.reset(token)


def observe_retrieval(agent: str, query: str, facts: list) -> None:
    records = _retrievals.get()
    if records is not None:
        records.append(deepcopy({"agent": agent, "query": query, "facts": facts}))
