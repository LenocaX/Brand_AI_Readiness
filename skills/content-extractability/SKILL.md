---
name: content-extractability
description: Analyze whether important website information is explicitly available in machine-readable text and identify content that may be difficult for automated systems to extract.
license: MIT
---

# Content Extractability Audit

## When to use

Use this skill when auditing whether important website
information can be clearly extracted by automated systems.

## Inputs

- Website URL
- Crawled PageData

## Procedure

1. Inspect crawled page text.
2. Inspect headings, links, images, and tables.
3. Detect pages with unusually little meaningful text.
4. Detect potentially informative images with missing or weak alt text.
5. Detect headings without sufficient supporting content.
6. Identify pages where important information may be difficult to extract.
7. Generate evidence-backed findings.
8. Assign severity and confidence.
9. Deduplicate findings.

## Output

Return findings containing:

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