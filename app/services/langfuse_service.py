"""
LangFuse Observability & Tracing Service
"""

import os
import logging
from typing import Optional, Any
from app.core.config import settings

log = logging.getLogger(__name__)

def get_langfuse_callback() -> Optional[Any]:
    """
    Initializes and returns the LangFuse CallbackHandler for automatic
    LangGraph & LangChain execution tracing.
    """
    if not (settings.LANGFUSE_PUBLIC_KEY and settings.LANGFUSE_SECRET_KEY):
        log.info("[LangFuse] Keys not configured — running without external telemetry")
        return None

    try:
        from langfuse.langchain import CallbackHandler
        handler = CallbackHandler(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST
        )
        log.info("[LangFuse] CallbackHandler initialized successfully")
        return handler
    except Exception as e:
        log.warning(f"[LangFuse] Failed to initialize CallbackHandler: {e}")
        return None
