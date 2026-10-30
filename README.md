# Brand AI-Readiness Audit

A read-only Agent Skill Marketplace for auditing websites for
AI discoverability and on-site engagement problems.

## Purpose

This marketplace analyzes a website and produces one structured
audit report containing evidence-backed findings and prioritized
suggested actions.

The audit covers two major areas:

1. AI discoverability
2. On-site engagement

## Skills

### 1. Crawl / Render Audit

Checks whether important website content is accessible to automated
crawlers and whether rendering or crawlability issues may prevent
important content from being discovered.

### 2. Structured Data Audit

Checks structured data such as JSON-LD and other machine-readable
metadata that can help systems understand entities and page content.

### 3. Content Extractability Audit

Checks whether important facts are available as explicit,
machine-readable text instead of being hidden inside non-text
or difficult-to-extract content.

### 4. Freshness & Corroboration Audit

Checks signals related to stale information, supporting evidence,
and consistency of important claims.

### 5. Engagement Audit

Checks page orientation, navigation, calls to action, contextual
navigation, dead ends, link quality, and heading structure.

### 6. Audit Orchestrator

The single marketplace entrypoint.

It runs the specialist audits, normalizes and deduplicates their
findings, validates the final structure, and produces one combined
audit report.

## Running the Audit

From the marketplace root:

```bash
python skills/audit_orchestrator/scripts/audit.py https://example.com