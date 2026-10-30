---
name: audit-orchestrator
description: Coordinate the website audit by running specialist skills and composing their evidence-backed findings into one normalized final report.
license: MIT
---

# Audit Orchestrator

## Purpose

Coordinate the specialist audit skills and produce one
consistent website audit report.

## Specialist Skills

The orchestrator coordinates:

1. crawl-render-audit
2. structured-data-audit
3. content-extractability
4. freshness-corroboration
5. engagement-audit

## Procedure

1. Validate the target website URL.
2. Run the required specialist audits.
3. Collect their findings.
4. Normalize finding structures.
5. Deduplicate overlapping findings.
6. Calculate summary statistics.
7. Preserve source URLs and evidence.
8. Generate one final report.

## Output

The final report contains:

- target URL
- pages checked
- crawl errors
- total findings
- severity summary
- findings
- recommendations
- audit metadata

## Safety

The orchestrator is read-only.

It must not:

- modify websites
- submit forms
- authenticate into accounts
- execute destructive operations
- expose secrets