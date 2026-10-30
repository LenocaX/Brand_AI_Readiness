---
name: engagement-audit
description: Analyze website pages for on-site orientation, navigation, calls to action, context retention, content hierarchy, and dead-end journeys, producing evidence-backed recommendations to improve visitor engagement.
license: MIT
---

# Engagement Audit

## When to use

Use this skill when auditing why visitors who reach a website
may have difficulty understanding the page, navigating the site,
retaining context, or identifying an appropriate next action.

## Inputs

- Website URL
- Crawled PageData

## Procedure

1. Inspect page titles and headings.
2. Determine whether each page communicates a clear purpose.
3. Inspect primary navigation and internal links.
4. Detect contextual calls to action.
5. Evaluate internal navigation and context retention.
6. Identify potential dead-end pages.
7. Evaluate content hierarchy.
8. Generate evidence-backed findings.
9. Assign severity and confidence.
10. Deduplicate findings.

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