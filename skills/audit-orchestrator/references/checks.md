# Audit Orchestration Checks

## Specialist Composition

The orchestrator must execute the specialist audit skills
and combine their outputs.

## Normalization

Every finding should contain:

- id
- category
- title
- severity
- confidence
- evidence
- impact
- suggested_action
- source_url

## Deduplication

Findings that represent the same underlying issue should
not appear repeatedly in the final report.

## Severity

Supported severity levels:

- critical
- high
- medium
- low
- info

## Summary

The final report should provide:

- pages checked
- crawl errors
- total findings
- findings by severity
- findings by category

## Evidence

Each finding should preserve the evidence produced by
the specialist skill.

## Safety

The orchestrator must remain read-only.