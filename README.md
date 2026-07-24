# Marketing OS

An AI-powered marketing decision-making system. It uses AI agents to analyze business goals and recommend market positioning strategies, with every AI decision going through a governance review before being finalized.

## What It Does

You give the system a business goal (e.g., *"Establish market position in GPU cloud compute for AI training"*), and it:

1. **Positioning Strategist** (AI agent) analyzes the goal, reviews available knowledge, and selects a positioning strategy from defined alternatives
2. **Governance Reviewer** checks the decision quality — rejects low-confidence decisions, approves high-confidence ones
3. **CMO Profile** handles escalations — reviews medium-confidence decisions at the executive level
4. Everything is logged in **Decision Records** with full audit trails

The system runs in two modes:
- **Deterministic** — rule-based reasoning, no AI needed
- **AI-assisted** — sends structured prompts to Claude (Anthropic), parses structured responses

## Current Status

| What | Status |
|---|---|
| Core data model | ✅ Complete |
| Memory system | ✅ Complete |
| Inference engine (model-agnostic) | ✅ Complete |
| Gemini API adapter | ✅ Complete (live-tested) |
| Claude API adapter | ⚠️ Written, not live-tested |
| Mock provider (for testing) | ✅ Complete |
| Positioning Strategist (AI agent) | ✅ Complete (dual-mode) |
| Governance + CMO review | ✅ Complete |
| Orchestrator | ✅ Complete |
| Test suite | ✅ 17 tests, all passing |
| Other AI roles (8 remaining) | ❌ Not started |
| Persistence | ❌ In-memory only |

## Quick Start

### Run locally (no dependencies needed)

```bash
# Clone
git clone https://github.com/namm9an/Marketing-OS.git
cd Marketing-OS

# Run all tests
python3 -m unittest discover

# Run the GPU cloud scenario (human-readable output)
python3 -m tests.scenario.test_gpu_cloud_launch
```

### Run the AI agent

```bash
# With Gemini (default):
export GEMINI_API_KEY="your-key-here"
python3 run_agent.py

# With Claude:
export ANTHROPIC_API_KEY="your-key-here"
python3 run_agent.py --provider claude

# Deterministic mode (no API key needed):
python3 run_agent.py --provider none

# Custom goal:
python3 run_agent.py --goal "Launch our SaaS product in the enterprise market"
```

### Run with Docker

```bash
# Run scenario comparison
docker compose up --build

# Run tests
docker compose run marketing-os python3 -m unittest discover

# Run agent with Gemini
docker compose run -e GEMINI_API_KEY=your-key marketing-os python3 run_agent.py
```

## Project Structure

```
Marketing-OS/
├── runtime/                    # The application code
│   ├── core/
│   │   └── primitives.py       # Data models: Goal, Positioning, DecisionRecord, etc.
│   ├── inference/
│   │   ├── base.py             # Model-agnostic inference contract
│   │   └── providers/
│   │       ├── gemini_provider.py   # Google Gemini adapter (stdlib urllib)
│   │       ├── claude_provider.py   # Anthropic Claude adapter (stdlib urllib)
│   │       └── mock_provider.py     # Deterministic test double
│   ├── memory/
│   │   └── memory.py           # Working / Episodic / Semantic memory
│   ├── orchestration/
│   │   └── orchestrator.py     # Workflow coordinator
│   └── roles/
│       ├── specialist/
│       │   ├── positioning_strategist.py  # The AI agent (dual-mode)
│       │   └── governance_reviewer.py     # Decision quality gate
│       └── executive/
│           └── cmo_profile.py  # Executive escalation handler
├── tests/
│   ├── unit/                   # 9 tests — memory, inference contract
│   ├── integration/            # 7 tests — full workflow, failure modes
│   └── scenario/               # 1 test — end-to-end business scenario
├── examples/
│   └── prototype-0.1/          # Original standalone prototype
├── backlog/
│   └── BACKLOG.md              # Enhancement tracking (29 items)
├── docs/
│   └── validation/
│       └── alpha-engineering-report.md
├── ROADMAP.md                  # Release plan
├── CHANGELOG.md                # Version history
├── INDEX.md                    # Document cross-reference
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

## Architecture

```
Orchestrator
  ├── Positioning Strategist
  │     ├── Memory (working / episodic / semantic)
  │     └── InferenceProvider (optional)
  │           ├── GeminiProvider (needs GEMINI_API_KEY)
  │           ├── ClaudeProvider (needs ANTHROPIC_API_KEY)
  │           └── MockProvider (no dependencies)
  ├── Governance Reviewer
  └── CMO Profile
```

The inference layer is model-agnostic — swapping Gemini for Claude, GPT, or any other provider requires implementing one class with a single `generate()` method. Zero changes to roles, orchestration, or core code.

## Requirements

- **Python 3.9+** (that's it — no pip install needed for deterministic/mock mode)
- **Docker** (optional, for containerized deployment)
- **GEMINI_API_KEY** (for Gemini API calls — default provider)
- **ANTHROPIC_API_KEY** (optional, for Claude API calls)

## Make Commands

```bash
make test          # Run all tests
make run           # Run the scenario comparison
make docker-build  # Build Docker image
make docker-run    # Run in Docker container
```

## Known Limitations

1. **Only 1 of 9 roles uses AI** — the other 8 are rule-based stubs
2. **In-memory only** — no persistence, everything is lost when the process stops
3. **Minimal prompt** — the AI system prompt works but isn't tuned for quality
4. **Claude provider not live-tested** — Gemini is the tested/default provider

See [backlog/BACKLOG.md](backlog/BACKLOG.md) for the full list of tracked items.

## License

MIT
