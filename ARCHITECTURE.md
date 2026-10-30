# Brand AI Readiness Audit — Architecture

## 1. Project Overview

Brand AI Readiness Audit is a Python-based auditing system designed to evaluate how effectively a brand's website can be understood, crawled, and interpreted by AI-powered systems.

The project analyzes website structure, content accessibility, engagement signals, and structured data to identify areas for improvement.

## 2. Project Structure

```text
Brand_AI_Readiness/
│
├── core/
│   ├── crawler.py
│   ├── deduplication.py
│   ├── engagement_score.py
│   ├── findings.py
│   ├── models.py
│   ├── recommendations.py
│   ├── renderer.py
│   ├── robots.py
│   ├── scoring.py
│   ├── severity.py
│   ├── sitemap.py
│   ├── url_utils.py
│   └── validate_report.py
│
├── skills/
│   ├── audit-orchestrator/
│   ├── content-extractability/
│   ├── crawl-render-audit/
│   ├── engagement-audit/
│   ├── freshness-corroboration/
│   └── structured-data-audit/
│
├── README.md
├── marketplace.json
└── requirements.txt
```

## 3. Core Modules

The core directory contains the main Python functionality:

- **Crawler:** Handles website crawling.
- **Deduplication:** Identifies duplicate information.
- **Engagement Score:** Evaluates engagement-related signals.
- **Findings:** Organizes audit findings.
- **Models:** Defines project data structures.
- **Recommendations:** Handles improvement recommendations.
- **Renderer:** Responsible for rendering-related functionality.
- **Robots:** Handles robots.txt-related checks.
- **Scoring:** Evaluates audit scores.
- **Severity:** Handles severity classification.
- **Sitemap:** Processes website sitemaps.
- **URL Utilities:** Provides URL-related utilities.
- **Report Validator:** Validates generated audit reports.

## 4. Audit Skills

The project contains six specialized audit skills:

1. Audit Orchestrator
2. Content Extractability
3. Crawl Render Audit
4. Engagement Audit
5. Freshness Corroboration
6. Structured Data Audit

These skills divide the overall auditing process into specialized evaluation areas.

## 5. Audit Workflow

The intended high-level workflow is:

1. Receive a target brand website.
2. Crawl and inspect relevant website resources.
3. Evaluate content accessibility and structure.
4. Analyze engagement and freshness signals.
5. Inspect structured data.
6. Consolidate findings and evaluate severity.
7. Generate recommendations and an audit report.

## 6. Dependencies

Project dependencies are maintained in `requirements.txt`.

Install them using:

```bash
pip install -r requirements.txt
```

## 7. Development

The project uses Python and is organized into modular components to keep the auditing functionality maintainable and extensible.