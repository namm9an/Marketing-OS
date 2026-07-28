"""
Script to expand docs/knowledge_base.md into a massive, multi-thousand-line Master System Knowledge Base & Audit Trail
Reads all scraped subpages, code manifests, prompts, and architecture specs.
"""

import os
import json
from pathlib import Path

BASE_DIR = Path("/Users/namanmoudgill13/Desktop/marketing manager request/Marketing-OS")
DEEP_SCRAPE_JSON = BASE_DIR / "app" / "data" / "deep_scrape_results.json"
KB_MD = BASE_DIR / "docs" / "knowledge_base.md"
ARTIFACT_KB_MD = Path("/Users/namanmoudgill13/.gemini/antigravity/brain/b79b81f3-5e03-426f-952f-9680a760e79c/knowledge_base.md")

# Everything from this heading down is written by hand, not generated. See build_expanded_kb().
AUTHORED_TAIL_MARKER = "# 🔎 Audit & Remediation Report"

def build_expanded_kb():
    content = []
    content.append("# 📚 Master System Knowledge Base, Code Manifest & Scrape Audit Trail")
    content.append("## Marketing OS v2.0 for E2E Networks\n")
    content.append("> **Notice**: This document is the primary, exhaustive context knowledge base for AI Coding Agents and Senior Developers building and maintaining Marketing OS v2.0.\n\n---\n")

    # SECTION 1: System Scope & Identity
    content.append("## 🏛️ 1. Executive Identity & Core Mission")
    content.append("* **Organization**: **E2E Networks** (NSE: E2E) — India's leading sovereign GPU cloud provider.")
    content.append("* **Architecture**: Governed Multi-Agent Swarm operating on a **LangGraph state machine** with **LangFuse full-trace observability** and **RAMP SQLite persistent memory** (`marketing_os.db`).\n\n---\n")

    # SECTION 2: Scraped Neo-Cloud Subpage Registry & Text Corpus
    content.append("## 🌐 2. Comprehensive Scraped Neo-Cloud Target Registry & Raw Subpage Corpus")
    content.append("Exhaustive audit of 35+ subpages across all **13 Neo-Cloud Target Organizations** (Top 10 Global + Top 3 India):\n")

    if DEEP_SCRAPE_PATH := DEEP_SCRAPE_JSON:
        if DEEP_SCRAPE_PATH.exists():
            scrape_data = json.loads(DEEP_SCRAPE_PATH.read_text())
            for idx, org in enumerate(scrape_data, 1):
                org_name = org.get("name")
                region = org.get("region")
                subpages = org.get("subpages", [])
                content.append(f"### 2.{idx} {org_name} ({region})")
                content.append(f"* **Total Subpages Audited**: {len(subpages)}")
                content.append("* **Audited Subpage Data**:\n")

                for page in subpages:
                    url = page.get("url", "")
                    status = page.get("status", "")
                    content.append(f"#### 🔗 URL: `{url}` (Status: {status})")
                    if page.get("headings"):
                        content.append(f"- **Headings**: {', '.join(page['headings'])}")
                    if page.get("gpus"):
                        content.append(f"- **Discovered GPUs**: {', '.join(page['gpus'])}")
                    if page.get("pricing"):
                        content.append(f"- **Extracted Pricing Terms**: {', '.join(page['pricing'])}")
                    if page.get("snippet"):
                        content.append("```text")
                        content.append(page["snippet"].strip())
                        content.append("```\n")

    content.append("\n---\n")

    # SECTION 3: Codebase Manifest & Full File Sources
    content.append("## 📁 3. Complete Source Code Manifest & File Annotations\n")

    app_dir = BASE_DIR / "app"
    for root, _, files in os.walk(app_dir):
        for file in sorted(files):
            if file.endswith(".py"):
                full_path = Path(root) / file
                rel_path = full_path.relative_to(BASE_DIR)
                content.append(f"### File: `{rel_path}`")
                content.append("```python")
                content.append(full_path.read_text())
                content.append("```\n")

    # Add Test Suite Code
    tests_dir = BASE_DIR / "tests"
    for root, _, files in os.walk(tests_dir):
        for file in sorted(files):
            if file.endswith(".py"):
                full_path = Path(root) / file
                rel_path = full_path.relative_to(BASE_DIR)
                content.append(f"### File: `{rel_path}`")
                content.append("```python")
                content.append(full_path.read_text())
                content.append("```\n")

    # Add Config & Docker Files
    for extra_file in ["Dockerfile", "docker-compose.yml", "requirements.txt", "README.md"]:
        fpath = BASE_DIR / extra_file
        if fpath.exists():
            content.append(f"### File: `{extra_file}`")
            content.append("```")
            content.append(fpath.read_text())
            content.append("```\n")

    # SECTION 4: Phase 7 research findings (replaces the CompTrack section — see note below)
    content.append("\n---\n")
    content.append("## 🔍 4. Phase 7 Research: Narrative-Shift Detection")
    content.append("> **This section replaced 'CompTrack Legacy Architecture & Prompt Injection Rules' on 2026-07-28.**")
    content.append("> CompTrack is a separate, unrelated project of the author's, mentioned once to an AI assistant as a")
    content.append("> verbal example of *\"something similar I built before\"*. The assistant read that codebase and wrote its")
    content.append("> architecture into this document as though it were a dependency of Marketing OS. It never was:")
    content.append("> `grep` across `app/` returns zero hits for `BEGIN_DATA`, `END_DATA`, `RAW_TEXT_CHAR_LIMIT`,")
    content.append("> `PER_SOURCE_CHAR_LIMIT`, `DAILY_PROMPT_TEMPLATE` or any of its prompt text. All five personas in")
    content.append("> `AGENT_REGISTRY` are original. The contamination was confined to documentation; no running code path")
    content.append("> was ever affected. The section is replaced rather than blanked so the provenance stays on record.\n")
    content.append("### 4.1 The problem")
    content.append("The PR agent is specified to track *\"global competitors, social posts, press releases, podcasts,")
    content.append("interviews, and **narrative shifts**\"*. Five of six are satisfied by the persona operating over the L0")
    content.append("corpus. The sixth is structurally impossible: `knowledge_units` carries a single `created_at`")
    content.append("(row-insert time), there is no re-crawl scheduler, and no row is ever linked to the row it replaced.")
    content.append("A narrative shift is *then* versus *now*; the corpus has no *then*.\n")
    content.append("### 4.2 The measured finding that dictates the architecture")
    content.append("From a labelled evaluation (CEUR-WS Vol-3964; 68 documents, 37 true narrative shifts):\n")
    content.append("| LLM role | Accuracy | Behaviour |")
    content.append("|---|---|---|")
    content.append("| **Judge** — *\"did the narrative shift?\"* | **57.35%** (F1 0.7010) | Reported a shift in **60 of 68** documents when only **37** were real |")
    content.append("| **Explainer** — *\"a shift was detected; what changed?\"* | **83.78%** | Correct on 31 of 37 |\n")
    content.append("The model cannot separate a **narrative** shift (repositioning) from a **content** shift (rewording, a")
    content.append("new footer, a CSS change). Asked to judge, it agrees. **Therefore: detection must be deterministic;")
    content.append("the LLM is only ever the explainer.** Inverting this produces an alert feed that is wrong ~62% of the")
    content.append("time — which a CMO stops opening within a week, taking the rest of the product's credibility with it.\n")
    content.append("### 4.3 Design")
    content.append("* **Layer 1 — SCD Type 2 time axis.** Add `valid_from` / `valid_to` / `is_current` to `knowledge_units`. A re-crawl closes the superseded row rather than overwriting it, so \"what they used to say\" stays queryable. Verified on this project's SQLite 3.46.0: `ALTER TABLE ... ADD COLUMN ... DEFAULT (datetime('now'))` is accepted and back-fills existing rows — migrates in place, no table rebuild.")
    content.append("* **Layer 2 — three-check cascade**, each stage ~100× cheaper than the next: content hash (kills ~95% of re-crawls at zero API cost) → structural signature (a redesign is not a repositioning) → embedding cosine (only this means the *meaning* moved).")
    content.append("* **Layer 3 — shift feed.** `JOIN now.valid_from = was.valid_to` yields before/after pairs. This is what the PR agent reads.")
    content.append("* **Layer 4 — explanation.** Gemini is invoked only on pairs that cleared Layer 2, and only to characterise the repositioning.")
    content.append("* **Prior art:** the bi-temporal model in Zep/Graphiti (facts invalidated, never deleted; reported DMR 94.8% vs MemGPT 93.4%). SCD Type 2 is its relational half — the part that matters here, in plain SQLite, with no new dependency.")
    content.append("* **Rejected:** RollingLDA / statistical change-point detection. Needs a continuous high-volume stream to estimate a baseline; this project crawls 13 organisations weekly. Scale mismatch.\n")
    content.append("\n---\n")

    # SECTION 5: LangGraph & LangFuse Architecture
    content.append("## 📐 5. LangGraph Swarm & LangFuse Tracing Specifications")
    content.append("```python")
    content.append("""
# Swarm State Schema
class SwarmState(TypedDict):
    goal_statement: str
    active_agent: str  # 'branding' | 'pr'
    provider: str
    messages: List[Dict[str, str]]
    positioning_statement: Optional[str]
    selected_option: Optional[str]
    rationale: Optional[str]
    risks: Optional[str]
    confidence: Optional[str]
    knowledge_units: List[Dict[str, Any]]
    trace_id: Optional[str]
""")
    content.append("```\n")

    final_text = "\n".join(content)

    # Sections 1-5 are generated; everything from the audit report onward is hand-authored
    # and must survive a regeneration. This script used to write `final_text` alone, which
    # silently deleted ~440 lines of audit trail every time it ran.
    if KB_MD.exists():
        existing = KB_MD.read_text()
        if (idx := existing.find(AUTHORED_TAIL_MARKER)) != -1:
            final_text = final_text.rstrip("\n") + "\n\n" + existing[idx:]
        else:
            raise SystemExit(
                f"refusing to write: {KB_MD} exists but has no {AUTHORED_TAIL_MARKER!r} marker,"
                " so the authored tail cannot be located and would be destroyed"
            )

    KB_MD.write_text(final_text)
    ARTIFACT_KB_MD.write_text(final_text)
    print(f"[+] Expanded Master Knowledge Base successfully written! Total lines: {len(final_text.splitlines())}, Size: {len(final_text)} bytes")

if __name__ == "__main__":
    build_expanded_kb()
