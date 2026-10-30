---
name: freshness-corroboration
description: Analyze website freshness signals and corroboration evidence for important claims, identifying potentially stale or weakly supported information without treating missing evidence as proof of falsehood.
license: MIT
---

# Freshness and Corroboration Audit

## When to use

Use this skill when auditing whether important website
information has credible freshness signals and visible
corroboration evidence.

## Inputs

- Website URL
- Crawled PageData

## Procedure

1. Inspect crawled pages for publication and modification dates.
2. Detect potentially stale time-sensitive information.
3. Identify pages where freshness cannot be established.
4. Extract important external references.
5. Distinguish independent corroboration from internal repetition.
6. Generate evidence-backed findings.
7. Assign severity and confidence.
8. Deduplicate findings.

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