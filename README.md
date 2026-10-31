# Canopy — Continuous Website Intelligence, AI-Readiness & Performance Monitoring Platform

Canopy is an evidence-driven website intelligence platform designed to audit, monitor, and optimize websites for the modern web and the emerging AI search ecosystem.

It unifies four core intelligence pillars into a cohesive SaaS architecture:
1. **AI-Readiness Intelligence**: How discoverable, extractable, and structured is your site for AI agents, LLM search engines, and automated crawlers?
2. **Performance Intelligence**: Core Web Vitals (LCP, INP, CLS, FCP, TTFB), mobile vs desktop profiling, and comprehensive image asset diagnostics.
3. **Visitor Intelligence**: First-party, privacy-first analytics SDK (`tracker.js` < 4KB) tracking real-time live visitors, traffic sources, top pages, scroll depth, and custom conversion goals—with zero raw IP retention.
4. **Continuous Monitoring & History**: Automated audit schedules, regression alerts, historical timeline tracking, public competitor benchmarking, and deterministic finding diffing.

---

## System Architecture

```
brand-ai-readiness-audit/
├── app.py                         # Application entrypoint: mounts FastAPI & serves static SPA
├── backend/
│   ├── main.py                    # FastAPI root application & router aggregator
│   ├── database.py                # Database connection (PostgreSQL / SQLite auto-fallback)
│   ├── models_db.py               # SQLAlchemy ORM models (10 relational entities)
│   ├── schemas.py                 # Pydantic v2 validation schemas
│   ├── auth.py                    # Bcrypt hashing, JWT generation, HTTP-only cookie auth
│   ├── verification.py            # Domain ownership verification (DNS TXT & HTTP token)
│   ├── performance.py             # Performance laboratory estimator & image asset analyzer
│   └── routers/
│       ├── auth.py                # Register, login, logout, current user session
│       ├── websites.py            # Multi-website CRUD, URL normalization, repeat-URL check, verify
│       ├── audits.py              # Persistent audit runs, finding diffing, competitor audits
│       ├── performance.py         # Standalone and persistent Core Web Vitals & image audits
│       ├── analytics.py           # Ingestion endpoint (/api/analytics/collect), dashboards, live visitors
│       └── monitoring.py          # Continuous monitoring schedules, health triggers, regression alerts
├── core/
│   ├── crawler.py                 # Multi-page HTTP crawler with SSRF protection
│   ├── renderer.py                # Playwright headless renderer (dynamic DOM analysis)
│   ├── robots.py                  # Multi-bot inspection (GPTBot, ClaudeBot, PerplexityBot, etc.)
│   ├── scoring.py                 # Deterministic penalty scoring engine
│   └── deduplication.py           # Finding normalization and cross-specialist deduplication
├── skills/
│   ├── crawl-render-audit/        # Skill 1: HTTP availability, titles, meta tags, and DOM comparison
│   ├── structured-data-audit/     # Skill 2: Schema.org JSON-LD validator
│   ├── content-extractability/    # Skill 3: Explicit readable text density & alt text
│   ├── freshness-proof-audit/     # Skill 4: Date signals, copyright currency, and citations
│   ├── engagement-audit/          # Skill 5: Heading hierarchy (H1-H3), nav landmarks, dead ends
│   └── audit-orchestrator/        # Specialist merger: normalizes findings & calculates scores
├── alembic/                       # Database schema versioning & migration scripts
├── frontend/                      # React 19 + TypeScript + Vite Single Page Application
│   ├── public/
│   │   ├── tracker.js             # First-party lightweight analytics SDK (< 4KB)
│   │   └── canopy-web-logo.svg    # Official Canopy tree-ring SVG logo
│   ├── src/
│   │   ├── api/client.ts          # Comprehensive REST API client
│   │   ├── components/            # Reusable UI widgets (IntelligenceScoreCard, AICrawlersSection)
│   │   ├── shell/                 # Header with website switcher, Sidebar navigation (7 views)
│   │   ├── views/                 # Landing, Overview, Findings, Details, Recs, Performance, Analytics, History, Monitoring, Settings
│   │   └── design-system/         # Forest & Ivory editorial design system
│   └── dist/                      # Pre-built production bundle served directly by FastAPI
├── reports/
│   ├── sample_report.json         # Pre-computed demonstration audit report
│   └── jobs/                      # Isolated per-job report storage ({job_id}.json)
└── tests/                         # Pytest suite (25 automated unit, QA, and E2E tests)
```

---

## The Four Intelligence Modules

### Module A — AI Readiness Intelligence
Evaluates your site across 5 specialist audit modules and multi-bot crawler permissions:
- **AI Crawler Inspection**: Directly parses `robots.txt` for 6 major AI bots:
  - `GPTBot` (OpenAI training)
  - `OAI-SearchBot` (SearchGPT real-time indexer)
  - `ClaudeBot` (Anthropic Claude)
  - `PerplexityBot` (Perplexity AI search engine)
  - `Google-Extended` (Gemini training crawlers)
  - `Bytespider` (ByteDance AI bot)
- **Content Extractability**: Analyzes readable prose density, heading content depth, and text-to-DOM ratio.
- **Structured Data**: Detects Schema.org JSON-LD entities (Organization, Product, Article, FAQ, Breadcrumbs).
- **Freshness & Proof**: Detects publication and update dates, footer copyright currency, and outbound corroboration citations.
- **Engagement Landmarks**: Audits primary navigation, heading hierarchies (H1–H3), and navigation dead ends.

### Module B — Performance Intelligence
Laboratory performance measurement and deep asset analysis:
- **Core Web Vitals**: Estimates Largest Contentful Paint (LCP), Interaction to Next Paint (INP), Cumulative Layout Shift (CLS), First Contentful Paint (FCP), and Time to First Byte (TTFB).
- **Device Emulation**: Tests both Desktop (1920x1080) and Mobile (375x667, 4G latency profile).
- **Image Asset Optimization Table**:
  - Image URL, file format (JPEG, PNG, WebP, AVIF, SVG), natural vs displayed dimensions.
  - Oversized image detection (e.g. 2000px natural rendered in 300px slot).
  - Missing dimension attributes (`width`/`height`) causing CLS layout shifts.
  - CDN verification (Cloudflare, Fastly, CloudFront, Vercel, Akamai, etc.).
  - LCP candidate identification.
  - Calculable byte savings from modern format conversion (WebP/AVIF compression).

### Module C — Visitor Intelligence & Privacy-First Tracking
Privacy-preserving web analytics without third-party cookies or intrusive tracking:
- **Lightweight Tracker SDK (`/tracker.js`)**: Under 4KB minified, zero external dependencies.
- **Privacy Standard**: Client IP is evaluated in-memory for country determination and raw IP is discarded immediately without saving to disk or database.
- **Zero Fabrication Guarantee**: The user engagement pillar strictly displays "Insufficient data" unless analytics are verified and installed, preventing score fabrication.
- **Metrics Collected**:
  - Unique visitor sessions (daily rotating salt hashing).
  - Pageviews, referrers, traffic channels (Organic Search, Social, Direct, Referral).
  - Country-level geolocation.
  - Scroll depth tracking milestones (25%, 50%, 75%, 100%).
  - Call-To-Action (CTA) clicks and outbound link clicks.
  - Custom conversion events via `window.canopy.track("Signup", { plan: "pro" })`.
  - Real-time active visitors in the last 5 minutes.

### Module D — Continuous Monitoring & Comparisons
Tracks health and performance trajectories over time:
- **Historical Timeline**: Graph of audit scores over time.
- **Deterministic Finding Diffing**: Categorizes findings between any two audits into **New Issues**, **Resolved Issues**, and **Persistent Issues** based on deterministic SHA-256 finding fingerprints.
- **Competitor Benchmarks**: Audit public competitor websites and compare AI-readiness, Core Web Vitals, and findings side-by-side.
- **Automated Monitoring Schedules**: Configure daily, weekly, or monthly automated checks.
- **Regression Alerts**: Generates alerts for score drops, new high/critical issues, and crawl errors.

---

## Database Architecture

Canopy uses **SQLAlchemy 2.0** and **Alembic** for schema migrations.

### Relational Models
1. `User`: Account credentials, hashed password, timestamps.
2. `Website`: Domain, canonical URL, category, verification status, verification token.
3. `AuditRun`: Persistent record of every executed audit, scores, summary, and raw JSON report.
4. `AuditFinding`: Individual normalized findings with severity, confidence, evidence, and deterministic fingerprints.
5. `PerformanceMetric`: Lab Core Web Vitals (LCP, INP, CLS, FCP, TTFB, total page weight, DOM count).
6. `ImageMetric`: Per-image diagnostic records (dimensions, oversized status, CDN, potential savings).
7. `AnalyticsEvent`: Raw telemetry events (pageview, scroll_depth, cta_click, conversion).
8. `VisitorSession`: Session records with visitor hash, country code, device type, entry page.
9. `MonitoringSchedule`: Scheduled checks (frequency: daily, weekly, monthly).
10. `Alert`: System notifications with severity (low, medium, high, critical) and read status.

### Dynamic Engine Configuration
- **Production**: Connects to PostgreSQL using `DATABASE_URL` (e.g. `postgresql+psycopg://user:pass@host:5432/canopy`).
- **Development Fallback**: If `DATABASE_URL` is unset, Canopy automatically initializes a local SQLite database (`canopy.db`), allowing out-of-the-box local development and testing.

---

## Getting Started

### Prerequisites
- **Python 3.10+** (Python 3.11, 3.12, 3.13, or 3.14)
- **Node.js 18+** (Optional, only required if compiling frontend code)

### 1. Install Dependencies

```bash
# Clone the repository
cd brand-ai-readiness-audit

# Create virtual environment (optional)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Install Playwright browser binaries
playwright install chromium
```

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default settings will use SQLite `canopy.db` and development secret keys automatically.

### 3. Run Database Migrations

```bash
alembic upgrade head
```

### 4. Start the Application

```bash
python app.py
```

The application will start on **`http://127.0.0.1:8000`**.
- **Interactive Web App**: `http://127.0.0.1:8000/`
- **Swagger REST API Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`
- **Health Endpoint**: `http://127.0.0.1:8000/api/health`
- **Tracker SDK**: `http://127.0.0.1:8000/tracker.js`

---

## Installing the Visitor Intelligence Tracker

Add this single snippet to your website's `<head>` or `<body>`:

```html
<!-- Canopy Visitor Intelligence -->
<script
  defer
  src="https://your-canopy-domain.com/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
></script>
```

### Tracking Custom Conversions
```javascript
// Track custom conversion actions anywhere in your application:
window.canopy?.track("Plan Upgraded", { plan: "Enterprise", value: 499 });
```

---

## REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Register a new user account |
| `/api/auth/login` | `POST` | Authenticate and obtain secure HTTP-only session cookie |
| `/api/auth/logout` | `POST` | Terminate session and clear cookie |
| `/api/auth/me` | `GET` | Get current authenticated user details |
| `/api/websites` | `GET` / `POST` | List and register websites |
| `/api/websites/repeat-check?url=...` | `GET` | Recognize repeat URLs and return historical scores |
| `/api/websites/{id}/verify` | `POST` | Verify domain ownership via DNS TXT or HTTP token |
| `/api/audits/website/{id}/history` | `GET` | Fetch audit timeline for a website |
| `/api/audits/compare/{run_a_id}/{run_b_id}` | `GET` | Deterministic finding diff between two audits |
| `/api/audits/competitors/compare` | `POST` | Run head-to-head comparison against public competitor |
| `/api/audits/crawlers/inspect?url=...` | `GET` | Check robots.txt permissions for 6 AI bots |
| `/api/performance/standalone` | `GET` | Lab Core Web Vitals & image analysis for any URL |
| `/api/performance/website/{id}` | `GET` | Latest performance metrics for a registered site |
| `/api/analytics/collect` | `POST` | Privacy-first analytics ingestion endpoint |
| `/api/websites/{id}/analytics/overview` | `GET` | Aggregated traffic, pageviews, referrers, bounce rate |
| `/api/websites/{id}/analytics/live` | `GET` | Active visitors currently on the site (last 5 min) |
| `/api/websites/{id}/monitoring/schedules`| `GET` / `POST` | Manage continuous scan schedules |
| `/api/websites/{id}/monitoring/alerts` | `GET` | Retrieve regression alerts and anomalies |
| `/api/health` | `GET` | Platform health status |
| `/api/sample-report` | `GET` | Pre-computed demonstration audit report |

---

## Running the Automated Test Suite

Run all 25 automated tests covering database persistence, authentication, URL normalization, performance calculations, analytics ingestion, robots.txt multi-bot inspections, scoring, and QA acceptance criteria:

```bash
pytest tests/ -v
```

---

## Frontend Development & Compilation

The frontend is built with React 19, TypeScript, and Vite, styled with Canopy's Forest & Ivory editorial design system (`#173A2C`, `#F5F3EB`).

```bash
cd frontend
npm install
npm run dev     # Starts Vite development server on port 5173
npm run build   # Compiles optimized production bundle to frontend/dist/
```

FastAPI automatically serves `frontend/dist/` in production mode at `http://127.0.0.1:8000/`.
