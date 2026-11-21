"""Install the bundled source observations without replacing operator data."""

import json
from contextlib import closing
from pathlib import Path

from app.core.grounding import is_grounded_source
from app.core.primitives import content_hash
from app.db.database import get_connection, init_db, retry_on_locked
from app.memory.graph import replace_corpus_edges

STARTER_SOURCES = Path(__file__).resolve().parents[1] / "data" / "starter_sources.json"
STARTER_PREFIX = "starter:"
SOURCE_CREATOR = "grounded_crawler"
SOURCE_CLASSES = {"hardware", "pricing", "positioning", "documentation"}
LEGACY_CONTENT_PREFIXES = {
    "hardware": "Verified GPU Hardware Fleet on ",
    "pricing": "Empirical Pricing & Rate Card Terms:",
    "positioning": "Official Website Positioning:",
    "documentation": "Verified Subpage Documentation:",
}

JUNK_SIGNATURES = (
    "404", "page not found", "not found", "oops!",
    "403", "forbidden", "access denied", "just a moment",
)
PAGE_CHROME_SIGNATURES = (
    "this website stores cookies", "these cookies are used to collect information",
    "company partner investor resources careers", "resources careers contact sign in",
    "skip to main content", "search docs or ask ai", "investors contact sales log in",
)


def is_valid_corpus_content(text: str, min_len: int = 40) -> bool:
    clean = " ".join((text or "").lower().split())
    return len(clean) >= min_len and not any(sig in clean for sig in JUNK_SIGNATURES + PAGE_CHROME_SIGNATURES)


def _source_key(organization, knowledge_class, source_url, content):
    return content_hash(f"{organization}|{knowledge_class}|{source_url}|{content}")


def _read_starter_sources():
    observations = json.loads(STARTER_SOURCES.read_text(encoding="utf-8"))
    if not isinstance(observations, list) or not observations:
        raise ValueError("Starter sources must be a nonempty list of observations")
    rows = {}
    for index, observation in enumerate(observations, start=1):
        if not isinstance(observation, dict):
            raise ValueError(f"Starter observation {index} must be an object")
        fields = [observation.get(key) for key in ("organization", "knowledge_class", "source_url", "content")]
        if not all(isinstance(value, str) and value.strip() for value in fields):
            raise ValueError(f"Starter observation {index} is missing required text")
        organization, knowledge_class, url, content = fields
        if (knowledge_class not in SOURCE_CLASSES or not is_grounded_source(SOURCE_CREATOR, url)
                or not is_valid_corpus_content(content)):
            raise ValueError(f"Invalid source, class, or content in starter observation {index}")
        identifier = STARTER_PREFIX + _source_key(organization, knowledge_class, url, content)
        if identifier in rows:
            raise ValueError(f"Duplicate starter observation {index}")
        rows[identifier] = (identifier, organization, knowledge_class, "high", content, url, SOURCE_CREATOR)
    return rows


@retry_on_locked()
def seed_grounded_knowledge(*, only_if_empty: bool = False):
    """Refresh managed sources. On startup, skip a starter set that already matches."""
    rows = _read_starter_sources()
    init_db()
    with closing(get_connection()) as conn, conn:
        # Two workers must see the same corpus, search index, and graph revision.
        conn.execute("BEGIN IMMEDIATE")
        managed_ids = set()
        for row in conn.execute(
            "SELECT id, organization, knowledge_class, source_url, content FROM knowledge_units WHERE enriched_by = ?",
            (SOURCE_CREATOR,),
        ):
            identifier, organization, knowledge_class, url, content = row
            legacy_prefix = LEGACY_CONTENT_PREFIXES.get(knowledge_class)
            # The first importer used 32-character IDs and these text templates.
            legacy_template = len(identifier) == 32 and legacy_prefix and content.startswith(legacy_prefix)
            legacy_hash = identifier == _source_key(organization, knowledge_class, url, content)
            if identifier.startswith(STARTER_PREFIX) or legacy_hash or legacy_template:
                managed_ids.add(identifier)
        if only_if_empty and managed_ids == rows.keys():
            return
        conn.executemany("DELETE FROM knowledge_units WHERE id = ?", ((identifier,) for identifier in managed_ids))
        conn.executemany(
            "INSERT INTO knowledge_units (id, organization, knowledge_class, confidence, content, source_url, enriched_by) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            rows.values(),
        )
        edges = replace_corpus_edges(conn)
    print(f"[+] Installed {len(rows)} starter observations with {edges} corpus graph edges.")


if __name__ == "__main__":
    seed_grounded_knowledge()
