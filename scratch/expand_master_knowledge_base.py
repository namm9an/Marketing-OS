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

    # SECTION 4: CompTrack Architecture & Prompt Patterns
    content.append("\n---\n")
    content.append("## 🔍 4. CompTrack Legacy Architecture & Prompt Injection Rules")
    content.append("* **Source Path**: `/Users/namanmoudgill13/Desktop/CompTrack`")
    content.append("* **Prompt Injection Protection**: Uses `BEGIN_DATA` and `END_DATA` tags to separate raw untrusted web content from LLM system instructions.")
    content.append("* **Text Capping Rules**: `RAW_TEXT_CHAR_LIMIT = 20,000`, `PER_SOURCE_CHAR_LIMIT = 4,000`.")
    content.append("* **Extracted System Prompt Templates**:\n")
    content.append("```python")
    content.append("""
DAILY_PROMPT_TEMPLATE = \"\"\"You are a competitive intelligence analyst.
Analyze the following raw scraped data from competitors and extract structured insights:
1. Product/Feature Announcements
2. Pricing/Rate Card Changes
3. Social Media & Executive PR Statements

Data Boundaries:
BEGIN_DATA
{raw_data}
END_DATA
\"\"\"
""")
    content.append("```\n\n---\n")

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
    KB_MD.write_text(final_text)
    ARTIFACT_KB_MD.write_text(final_text)
    print(f"[+] Expanded Master Knowledge Base successfully written! Total lines: {len(final_text.splitlines())}, Size: {len(final_text)} bytes")

if __name__ == "__main__":
    build_expanded_kb()
