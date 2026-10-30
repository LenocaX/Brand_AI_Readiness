# Crawl & Render Audit

## Purpose

Analyze a website's crawlability, basic HTML metadata,
content structure, and browser-rendered state.

## Inputs

- Website URL
- Maximum number of pages
- Maximum crawl depth

## Process

1. Read robots.txt rules.
2. Crawl internal pages.
3. Fetch HTML.
4. Parse page metadata.
5. Extract headings.
6. Extract links.
7. Compare raw and rendered page text.
8. Generate evidence-backed findings.
9. Deduplicate findings.

## Checks

### HTTP Status

Detect 4xx and 5xx responses.

### Page Title

Detect missing page titles.

### Meta Description

Detect missing meta descriptions.

### Heading Structure

Detect missing or multiple H1 headings.

### Internal Links

Identify pages with limited internal discoverability.

### Rendering

Compare initial HTML content with browser-rendered content.

## Finding Requirements

Each finding contains:

- ID
- Category
- Title
- Severity
- Confidence
- Evidence
- Impact
- Suggested action
- Source URL

## Safety

The skill performs read-only analysis.

It does not:

- submit forms
- modify website content
- authenticate into user accounts
- upload files
- perform destructive actions