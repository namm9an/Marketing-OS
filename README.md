# Marketing OS

Marketing OS is a competitive research workspace for branding, PR and policy,
community, product marketing, and field events. Browse the agent gallery for
examples or open the operator console to run a brief, compare two specialists,
review recommendations, and export the result.

The public site and console use React and Vite. Flask serves the API and the
production build. SQLite stores decisions, reviews, and scoped memory. A small
starter corpus links competitor observations to their source pages. The public
examples are illustrative briefs and recommendations with selected citations.

## Run locally

Use Python 3.11+ and Node.js 22.12+.

```bash
git clone --branch feat/frontend-overhaul https://github.com/namm9an/Marketing-OS.git
cd Marketing-OS
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
npm --prefix frontend ci
```

On Windows PowerShell, activate the virtual environment with
`.venv\Scripts\Activate.ps1`.

For console access, put `ADMIN_USER` and `ADMIN_PASSWORD` in a local `.env`.
You can set `TARGET_ORGANIZATION` and `TARGET_INDUSTRY` to provide the agents
with your organization and market context. Test locally with controlled
responses by leaving `GEMINI_API_KEY` unset. Live runs need a server-side key and
an explicit `DEFAULT_MODEL` supported by your provider account.

Run the API and Vite in separate terminals from the repository root.

```bash
python -m app.main
```

```bash
npm --prefix frontend run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>. `/` is the
showcase and `/console` is the operator entry. Vite proxies `/api` to
`http://127.0.0.1:10000`. Set `MARKETING_OS_API_TARGET` if the API uses a
different address.

For a single-port preview, run `npm --prefix frontend run build` and open
<http://localhost:10000> with Flask running. Check `/api/health` for API and
database health.

## Verify a change

```bash
python -m pytest -q tests/unit tests/integration
npm --prefix frontend run test:unit
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:integration
npm --prefix frontend run test:integration:built
```

Browser tests use Chromium and start the API with isolated SQLite data and
controlled provider responses. Install Chromium with `npx playwright install
chromium` from `frontend/` if the system browser is unavailable.

To measure retrieval against the starter corpus, run `python -m app.eval.retrieval`
against a newly initialized SQLite database. Source URLs describe the evidence
scope. Availability, prices, and other time-sensitive claims require a fresh
check before publication.

## Deployment configuration

`render.yaml` and `render-preview.yaml` target `feat/frontend-overhaul` and
check `/api/health`. Both are configured for manual deployment. Supply operator
credentials and a strong session secret through Render settings. Use persistent
storage for `DB_PATH` when decisions and reviews must survive restarts. The
preview uses temporary storage and is intended for disposable review data.

On startup, the API installs or updates the bundled observations and rebuilds
the source-derived graph. Saved decisions, reviews, operator facts, and scoped
memory stay in the existing database.
