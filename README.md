# Brand AI-Readiness Audit

An evidence-driven website audit platform evaluating **AI discoverability**, **semantic extractability**, and **on-site engagement**.

The application combines a high-performance **FastAPI backend orchestrator**, **five specialist Python audit skills**, and an editorial-style **React + TypeScript SPA** adhering to strict data integrity standards (zero data fabrication, isolated per-job storage, and evidence-backed finding inspectors).

---

## Architecture Overview

```
brand-ai-readiness-audit/
├── app.py                     # Primary entry point: starts FastAPI & serves static SPA
├── backend/
│   └── main.py                # FastAPI REST API (async job orchestration, report isolation)
├── core/
│   ├── crawler.py             # Multi-page HTTP crawler with SSRF protection
│   ├── renderer.py            # Playwright headless renderer (dynamic DOM analysis)
│   ├── robots.py              # robots.txt parser with in-memory caching
│   ├── scoring.py             # Deterministic penalty scoring engine
│   └── deduplication.py       # Finding normalization and cross-specialist deduplication
├── skills/
│   ├── crawl-render-audit/    # Skill 1: HTTP availability, titles, meta tags, and DOM comparison
│   ├── structured-data-audit/ # Skill 2: Schema.org JSON-LD validator
│   ├── content-extractability/# Skill 3: Explicit readable text density & alt text
│   ├── freshness-proof-audit/ # Skill 4: Date signals, copyright currency, and citations
│   ├── engagement-audit/      # Skill 5: Heading hierarchy (H1-H3), nav landmarks, dead ends
│   └── audit-orchestrator/    # Specialist merger: normalizes findings & calculates scores
├── frontend/                  # React 18 + TypeScript + Vite Single Page Application
│   ├── src/
│   │   ├── api/client.ts      # REST API client with polling & job management
│   │   ├── shell/             # App header, sidebar navigation, modals
│   │   ├── views/             # Landing, In-Progress, Overview, Findings, Details, Recs
│   │   └── design-system/     # Forest & Ivory editorial design system
│   └── dist/                  # Pre-built production bundle served directly by FastAPI
├── reports/
│   ├── sample_report.json     # Pre-computed demonstration audit report
│   └── jobs/                  # Isolated per-job report storage ({job_id}.json)
└── tests/                     # Comprehensive pytest test suite (scoring, QA, deduplication)
```

---

## The Five Specialist Audit Skills

1. **Crawl & Render**: Evaluates HTTP response codes, `<title>` tags, meta descriptions, Open Graph/Twitter metadata, and compares raw server HTML with browser-rendered DOM.
2. **Structured Data**: Detects and validates Schema.org JSON-LD entity structures and machine-readable metadata.
3. **Content Extractability**: Analyzes readable text density, heading content depth, and image alt text discoverability for LLM aggregators and AI crawlers.
4. **Freshness & Proof**: Inspects publication dates, copyright currency in footers, and corroboration references for claims.
5. **Engagement**: Audits primary navigation landmarks, heading hierarchy (H1–H3), calls to action, and navigation dead-end pages.
6. **Audit Orchestrator**: Merges findings from all specialists, removes cross-skill duplicates, applies additive scoring deductions, and prepares the schema-validated report.

---

## Getting Started

### Prerequisites

- **Python 3.10+** (Python 3.11, 3.12, 3.13, or 3.14 supported)
- **Node.js 18+** (Optional, only required if modifying frontend source code)

### 1. Install Backend Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/brand-ai-readiness-audit.git
cd brand-ai-readiness-audit

# Create and activate a virtual environment (optional but recommended)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser binaries
playwright install chromium
```

### 2. Start the Server

```bash
python app.py
```

The application will start on **`http://127.0.0.1:8000`**. Open your browser to access:
- **Interactive Web UI**: `http://127.0.0.1:8000/`
- **Swagger API Docs**: `http://127.0.0.1:8000/docs`
- **Sample Report API**: `http://127.0.0.1:8000/api/sample-report`

---

## Frontend Development (Optional)

The backend already serves the pre-compiled production build from `frontend/dist/`. To make changes to the frontend:

```bash
cd frontend
npm install
npm run dev     # Starts Vite dev server with proxy to FastAPI on port 8000
npm run build   # Recompiles to frontend/dist/
```

---

## Running CLI Audits

You can also run headless standalone audits directly from the command line:

```bash
# Run orchestrator and save to output file
python skills/audit-orchestrator/scripts/audit.py https://example.com reports/jobs/my_audit.json
```

---

## Running Automated Tests

```bash
pytest tests/ -v
```

---

## Key Features & Guarantees

- **Strict Data Isolation**: Every live audit writes to its own isolated file in `reports/jobs/{job_id}.json`. No cross-job data leakage.
- **Evidence-Backed Finding Details**: Four purpose-built inspection tabs: *Overview*, *Technical Evidence*, *Remediation* (with one-click clipboard copy), and *Inspector Context*.
- **Zero Fabrication**: Uncollected telemetry signals are explicitly marked as *"Not collected in this audit"*.
- **SSRF Protection**: Crawler validates IP ranges against private, loopback, and link-local ranges across all redirect chains.
- **Cached Robots Parsing**: In-memory caching prevents repetitive blocking network requests.
