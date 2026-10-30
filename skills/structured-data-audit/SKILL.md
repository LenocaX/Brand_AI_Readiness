---
name: structured-data-audit
description: Analyze website structured data and identify missing or incomplete JSON-LD information that may reduce machine-readable understanding of important pages.
license: MIT
---

# Structured Data Audit

## When to use

Use this skill when auditing a website for machine-readable
structured information and Schema.org JSON-LD.

## Inputs

- Website URL
- Maximum crawl pages
- Maximum crawl depth

## Procedure

1. Crawl the target website using the shared crawler.
2. Extract JSON-LD from each crawled page.
3. Identify Schema.org types.
4. Validate relevant fields for detected schema types.
5. Generate evidence-backed findings.
6. Assign severity and confidence.
7. Deduplicate findings.

## Checks

The skill checks:

- JSON-LD presence
- Organization data
- Product data
- Article data
- BreadcrumbList data
- Missing important fields

## Output

Return structured findings containing:

- id
- category
- title
- severity
- confidence
- evidence
- impact
- suggested_action
- source_url

## Safety

This skill is read-only.

It does not modify websites, submit forms,
authenticate into accounts, or perform destructive actions.