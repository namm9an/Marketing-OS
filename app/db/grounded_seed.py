"""
Seed stored source observations with URL provenance.
Snapshots are partial observations, not a complete/current catalogue of a company.
"""

import sys
import json
from contextlib import closing
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.db.database import get_connection, init_db, retry_on_locked
from app.core.config import settings
from app.core.primitives import content_hash

DEEP_SCRAPE_PATH = BASE_DIR / "app" / "data" / "deep_scrape_results.json"

JUNK_SIGNATURES = (
    "404", "page not found", "not found", "oops!",
    "403", "forbidden", "access denied", "just a moment"
)
PAGE_CHROME_SIGNATURES = (
    "this website stores cookies", "these cookies are used to collect information",
    "company partner investor resources careers", "resources careers contact sign in",
    "skip to main content", "search docs or ask ai", "investors contact sales log in",
)


def is_valid_corpus_content(text: str, min_len: int = 40) -> bool:
    clean = " ".join((text or "").lower().split())
    if len(clean) < min_len:
        return False
    return not any(sig in clean for sig in JUNK_SIGNATURES + PAGE_CHROME_SIGNATURES)


@retry_on_locked()
def seed_grounded_knowledge(*, only_if_empty: bool = False):
    init_db()
    with closing(get_connection()) as conn, conn:
        # Serialize the empty check and replacement across startup workers.
        conn.execute("BEGIN IMMEDIATE")
        if only_if_empty and conn.execute("SELECT 1 FROM knowledge_units LIMIT 1").fetchone():
            return
        if not DEEP_SCRAPE_PATH.exists():
            print(f"[!] Grounded scrape file {DEEP_SCRAPE_PATH} not found!")
            return
        raw_data = json.loads(DEEP_SCRAPE_PATH.read_text())
        conn.execute("DELETE FROM knowledge_units")
        conn.execute("DELETE FROM knowledge_units_fts")
        total_facts = 0

        for org in raw_data:
            org_name = org["name"]
            if "(Us)" in org_name or "E2E Networks" in org_name:
                org_name = settings.TARGET_ORGANIZATION
            region = org["region"]
            subpages = org.get("subpages", [])

            for page in subpages:
                if page.get("status") != "success":
                    continue

                url = page.get("url", "")
                snippet = page.get("snippet", "").strip()
                gpus = page.get("gpus", [])
                pricing = page.get("pricing", [])
                headings = page.get("headings", [])
                first_heading = headings[0].strip() if headings else ""

                # Multi-field 404 validation filter: reject pages containing error signatures
                combined_check = f"{first_heading} {snippet}".lower()
                if any(sig in combined_check for sig in JUNK_SIGNATURES):
                    continue

                # 1. Fact: Hardware Availability
                if gpus:
                    gpu_fact = f"Hardware fleet observations in a source snapshot for {org_name}: {', '.join(sorted(gpus))}. This is not a complete fleet inventory."
                    fact_id = content_hash(f"{org_name}|hardware|{url}|{gpu_fact}")
                    conn.execute(
                        "INSERT INTO knowledge_units (id, organization, knowledge_class, confidence, content, source_url, enriched_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (fact_id, org_name, "hardware", "high", gpu_fact, url, "grounded_crawler")
                    )
                    total_facts += 1

                # 2. Fact: Rate Cards & Pricing
                if pricing:
                    pricing_fact = f"Pricing observations and rate-card strings in a source snapshot (SKU/region mapping not recorded): {', '.join(pricing[:4])}."
                    fact_id = content_hash(f"{org_name}|pricing|{url}|{pricing_fact}")
                    conn.execute(
                        "INSERT INTO knowledge_units (id, organization, knowledge_class, confidence, content, source_url, enriched_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (fact_id, org_name, "pricing", "high", pricing_fact, url, "grounded_crawler")
                    )
                    total_facts += 1


                # 3. Fact: Verified Positioning Headings
                if first_heading and not any(sig in first_heading.lower() for sig in JUNK_SIGNATURES):
                    positioning_fact = f'Official Website Positioning: "{first_heading}".'
                    fact_id = content_hash(f"{org_name}|positioning|{url}|{positioning_fact}")
                    conn.execute(
                        "INSERT INTO knowledge_units (id, organization, knowledge_class, confidence, content, source_url, enriched_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (fact_id, org_name, "positioning", "high", positioning_fact, url, "grounded_crawler")
                    )
                    total_facts += 1

                # 4. Fact: Grounded Subpage Snippet
                if len(snippet) > 50 and is_valid_corpus_content(snippet, min_len=40):
                    clean_snippet = " ".join(snippet.split())[:300]
                    content_fact = f"Source page excerpt: {clean_snippet}"
                    fact_id = content_hash(f"{org_name}|documentation|{url}|{content_fact}")
                    conn.execute(
                        "INSERT INTO knowledge_units (id, organization, knowledge_class, confidence, content, source_url, enriched_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (fact_id, org_name, "documentation", "high", content_fact, url, "grounded_crawler")
                    )
                    total_facts += 1

    print(f"[+] Seeded {total_facts} source-linked observations across {len(raw_data)} organizations.")

    # The corpus graph (M9.4) is derived from these rows, and this function replaced all
    # of them. Re-derive here rather than at boot alone, so the graph can never describe
    # a corpus that no longer exists.
    from app.memory.graph import rebuild_corpus_graph
    print(f"[+] Corpus graph re-derived: {rebuild_corpus_graph()} edges")

if __name__ == "__main__":
    seed_grounded_knowledge()
