# Canopy — Architecture

## 1. Project Overview

Canopy (repository: Brand AI Readiness Audit) is a website intelligence platform. It evaluates how well a site can be discovered, crawled, extracted and understood by AI search systems and crawlers, and extends that audit with performance measurement, first-party visitor analytics and continuous monitoring.

The system has four pillars:

1. **AI-Readiness Intelligence**: five specialist audit skills plus an orchestrator, and a multi-bot `robots.txt` inspection.
2. **Performance Intelligence**: estimated Core Web Vitals and image asset diagnostics.
3. **Visitor Intelligence**: a privacy-first analytics SDK (`tracker.js`) and dashboards.
4. **Continuous Monitoring**: audit history, deterministic finding diffs, competitor comparison, schedules and regression alerts.

For setup, API usage and the endpoint reference, see `README.md`.

## 2. Project Structure

```text
Brand_AI_Readiness/
├── app.py                  # Entrypoint: runs FastAPI (backend.main:app) with uvicorn
├── backend/                # FastAPI application and persistence layer
│   ├── main.py             # App, CORS, router mounting, audit job runner, SPA/static serving
│   ├── database.py         # SQLAlchemy engine/session (PostgreSQL or SQLite fallback)
│   ├── models_db.py        # ORM models (10 entities)
│   ├── schemas.py          # Pydantic v2 request/response schemas
│   ├── auth.py             # Password hashing, JWT creation/verification, current-user dependency
│   ├── verification.py     # Domain ownership verification (HTTP file / DNS TXT)
│   ├── performance.py      # Performance estimator and image asset analyzer
│   └── routers/            # auth, websites, audits, performance, analytics, monitoring
├── core/                   # Shared audit engine modules
│   ├── crawler.py          # Multi-page HTTP crawler with SSRF protection
│   ├── renderer.py         # Playwright headless rendering for DOM comparison
│   ├── robots.py           # robots.txt parsing and AI crawler permissions
│   ├── sitemap.py          # Sitemap discovery and parsing
│   ├── url_utils.py        # URL normalization helpers
│   ├── models.py           # Shared data structures
│   ├── findings.py         # Finding construction helpers
│   ├── deduplication.py    # Finding normalization and de-duplication
│   ├── severity.py         # Severity ranking and priority mapping
│   ├── scoring.py          # Deterministic penalty-based readiness score
│   ├── engagement_score.py # Engagement dimension scoring
│   ├── recommendations.py  # Finding-to-recommendation mapping
│   └── validate_report.py  # Report schema validation
├── skills/                 # Specialist audits, each with SKILL.md, scripts/audit.py, references/checks.md
│   ├── crawl-render-audit/
│   ├── structured-data-audit/
│   ├── content-extractability/
│   ├── freshness-corroboration/
│   ├── engagement-audit/
│   └── audit-orchestrator/
├── alembic/                # Database migrations (initial schema)
├── frontend/               # React 19 + TypeScript + Vite SPA (src/, public/, prebuilt dist/)
├── reports/                # sample_report.json and per-job reports (reports/jobs/{job_id}.json)
├── tests/                  # Pytest suite
├── marketplace.json
├── requirements.txt
└── .env.example
```

## 3. High-Level Architecture

```text
 Browser (React SPA)  ──HTTP/JSON──▶  FastAPI (backend/main.py + routers)
        ▲                                   │
        │ serves frontend/dist              ├──▶ SQLAlchemy ──▶ PostgreSQL / SQLite (canopy.db)
        │                                   │
 Website with tracker.js ──POST──▶ /api/analytics/collect
                                            │
                                            └──▶ Audit job (background thread)
                                                    └─ subprocess: audit-orchestrator/scripts/audit.py
                                                         ├─ crawl-render-audit
                                                         ├─ structured-data-audit
                                                         ├─ content-extractability
                                                         ├─ freshness-corroboration
                                                         └─ engagement-audit
                                                            (all use core/ modules)
                                                    └─ writes reports/jobs/{job_id}.json
                                                    └─ findings + scores persisted to the database
```

FastAPI serves the built SPA from `frontend/dist/` (assets mounted at `/assets`), so one process serves both the API and the UI in production.

## 4. Backend

### 4.1 Application and routing

`backend/main.py` creates the FastAPI app, enables CORS for local frontend development, creates tables on startup, and includes six routers: `auth`, `websites`, `audits`, `performance`, `analytics`, `monitoring`. It also defines these endpoints directly:

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Health check |
| `GET /tracker.js` | Serves the analytics SDK |
| `GET /api/sample-report` | Pre-computed demo report |
| `POST /api/jobs` | Create an asynchronous audit job |
| `GET /api/jobs/{job_id}` | Poll job status and per-stage progress |
| `POST /api/jobs/{job_id}/cancel` | Cancel a running job |
| `POST /api/audits`, `GET /api/audits/{job_id}` | Synchronous (`?sync=true`) and by-id audit access |
| `GET /api/report` | Fetch a report (optionally by `job_id`) |

### 4.2 Audit job lifecycle

1. `POST /api/jobs` validates the target URL (SSRF-safe validation), creates a job record with a `job-<uuid>` ID and stage map (`crawl`, `structured_data`, `content_extractability`, `freshness`, `engagement`, `orchestrator`), and starts a daemon thread.
2. The worker runs the audit orchestrator as a **subprocess** (`sys.executable -u ... <url> <report_path>`) and reads its stdout line by line. Stage markers in the output update job progress, so progress reflects real execution rather than a timer.
3. The orchestrator runs the five specialist skills, merges and de-duplicates their findings, scores them and writes an isolated per-job report to `reports/jobs/{job_id}.json`.
4. On completion the worker loads the report, and if the job is tied to a registered website, persists the audit run and its findings to the database.
5. Job state is held in memory behind a lock (`jobs`, `job_processes`). It is lost on restart; persisted audit runs and report files are not.

### 4.3 Authentication

- Passwords are hashed with bcrypt.
- Sessions use JWTs (HS256) signed with `JWT_SECRET_KEY`, valid for 7 days.
- The token is read from the HTTP-only `canopy_session` cookie first, with bearer-token support as a fallback.
- Routes use a current-user dependency to scope data to the owning user.

### 4.4 Domain verification

`backend/verification.py` proves site ownership in either of two ways:
- **HTTP**: a token served at `/.well-known/canopy-verification.txt`.
- **DNS**: a TXT record `canopy-verification=<token>` (via `dnspython`).

### 4.5 Performance module

`backend/performance.py` produces laboratory estimates of LCP, INP, CLS, FCP and TTFB for desktop and mobile profiles, plus an image analysis (format, natural vs displayed size, missing dimensions, CDN detection, LCP candidate, estimated savings from modern formats). Results are exposed as standalone checks and persisted per website.

### 4.6 Analytics module

`backend/routers/analytics.py` ingests events from `tracker.js` and serves dashboards:
- Raw IPs are used in memory for country lookup and are never stored.
- Visitor identity is a hash with a rotating daily salt.
- Collected data includes pageviews, referrers and channels, scroll-depth milestones, CTA and outbound clicks, custom conversions and live visitors (last 5 minutes).
- The engagement score reports "Insufficient data" until analytics is installed and verified, rather than inventing a value.

### 4.7 Monitoring module

`backend/routers/monitoring.py` manages daily/weekly/monthly schedules and regression alerts (score drops, new high/critical findings, crawl errors). Audit comparison diffs findings by deterministic SHA-256 fingerprints into new, resolved and persistent issues.

## 5. Audit Engine

### 5.1 Specialist skills

Each skill is a folder with a `SKILL.md` (purpose and instructions), `scripts/audit.py` (implementation) and `references/checks.md` (check definitions).

| Skill | Responsibility |
|---|---|
| `crawl-render-audit` | HTTP availability, titles and meta tags, raw vs rendered DOM comparison |
| `structured-data-audit` | Schema.org JSON-LD detection and validation |
| `content-extractability` | Readable text density, heading depth, alt text |
| `freshness-corroboration` | Publication/update dates, copyright currency, outbound corroboration |
| `engagement-audit` | Heading hierarchy, navigation landmarks, dead ends |
| `audit-orchestrator` | Runs the specialists, normalizes and de-duplicates findings, calculates scores, writes the report |

### 5.2 Scoring

`core/scoring.py` is deterministic and penalty-based. The readiness score starts at 100 and subtracts a weight per finding, clamped to 0–100:

| Severity | Penalty |
|---|---|
| critical | 20 |
| high | 10 |
| medium | 5 |
| low | 2 |
| info | 0 |

Category weights are defined for crawl (20), render (20), structured data (20), content (20), freshness (10) and engagement (10). `core/severity.py` ranks severities and maps severity plus confidence to a priority (critical → URGENT, high → HIGH, medium → MEDIUM at confidence ≥ 0.8, otherwise LOW). `core/engagement_score.py` scores engagement dimensions separately.

### 5.3 AI crawler inspection

`core/robots.py` evaluates `robots.txt` permissions for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and Bytespider.

## 6. Data Model

Defined in `backend/models_db.py` (SQLAlchemy 2.0), versioned with Alembic:

| Entity | Purpose |
|---|---|
| `User` | Account and credentials |
| `Website` | Domain, canonical URL, category, verification state and token |
| `AuditRun` | One audit execution: scores, summary, raw report JSON |
| `AuditFinding` | Normalized finding with severity, confidence, evidence, fingerprint |
| `PerformanceMetric` | Core Web Vitals and page weight per run |
| `ImageMetric` | Per-image diagnostics |
| `AnalyticsEvent` | Raw telemetry events |
| `VisitorSession` | Session record (visitor hash, country, device, entry page) |
| `MonitoringSchedule` | Scheduled checks |
| `Alert` | Regression and anomaly notifications |

**Engine selection** (`backend/database.py`): `DATABASE_URL` selects PostgreSQL (with connection pooling and pre-ping). If unset or unreachable, the app falls back to a local SQLite file, `canopy.db`.

## 7. Frontend

React 19 + TypeScript + Vite single-page app in `frontend/`:
- `src/api/client.ts`: REST client.
- `src/shell/`: app shell, header with website switcher, sidebar, footer.
- `src/views/`: Landing, Auth modal, Audit in progress, Report overview, Findings, Finding detail, Recommendations, Performance, Analytics, History comparison, Monitoring, Settings.
- `src/components/`: shared widgets (score card, AI crawler section).
- `src/design-system/`: tokens, reset and base components (Forest & Ivory design system).
- `public/tracker.js`: the analytics SDK served to customer sites.
- `dist/`: prebuilt bundle served by FastAPI; rebuild with `npm run build`.

## 8. Configuration

Environment variables currently read by the code:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string; empty uses SQLite |
| `JWT_SECRET_KEY` | JWT signing secret; falls back to a hardcoded dev key, so **set it in production** |

`.env.example` also lists `SESSION_COOKIE_SECURE`, `HOST`, `PORT`, `ENVIRONMENT` and `LLM_API_KEY`, but nothing reads them yet. The session cookie is set with `secure=False` in `backend/routers/auth.py`, and `app.py` binds to `127.0.0.1:8000` directly.

## 9. Dependencies

Python dependencies are in `requirements.txt` (FastAPI, uvicorn, Pydantic, SQLAlchemy, Alembic, psycopg, bcrypt, PyJWT, requests, BeautifulSoup, lxml, Playwright, dnspython, pytest). Playwright also needs its browser installed (`playwright install chromium`). Frontend dependencies are in `frontend/package.json` and are only needed when rebuilding the UI.

## 10. Testing

Pytest suites in `tests/` cover scoring, database and auth, performance, analytics, QA scenarios and end-to-end acceptance criteria. Run them with `pytest tests/ -v`. The `frontend/test-*.cjs` scripts are frontend validation scripts.

## 11. Known Limitations and Notes

- Audit job state is in memory and is lost on restart.
- Audits run as a subprocess per job; concurrency is limited by the host.
- Performance figures are laboratory estimates, not real-user measurements.
- `canopy.db` and `canopy_backup.db` are committed to the repository and are not covered by `.gitignore`. They should be removed from version control.
- The session cookie is not marked `secure`, and the JWT secret has a dev default; both need hardening before HTTPS production use.