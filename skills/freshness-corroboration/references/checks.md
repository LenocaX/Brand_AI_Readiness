# Freshness and Corroboration Checks

## 1. Date Signal Detection

Inspect pages for:

- publication dates
- modified dates
- updated dates
- year indicators
- time-sensitive content markers

Do not assume that the absence of a date means that
the content is stale.

---

## 2. Stale Content Signals

Look for evidence that important content may be outdated.

Examples:

- explicitly old update date
- old "latest" claims
- outdated year references
- obsolete event information
- expired-looking offers

Only report stale-content findings when there is
supporting evidence.

---

## 3. Freshness Uncertainty

If a page contains potentially time-sensitive
information but exposes no useful freshness signal,
report that freshness cannot be established.

Do not label the content as stale.

---

## 4. Corroboration

Inspect whether important claims have visible
references to independent sources.

Examples:

- press coverage
- external publications
- authoritative references
- awards
- certifications
- independent reviews
- third-party organizations

The presence of an external link does not prove
that the claim is true.

---

## 5. Internal Repetition

Compare important facts across multiple crawled pages.

If the same business fact appears consistently across
multiple pages, record it as internally consistent.

Internal repetition must not be treated as
independent corroboration.

---

## 6. External Source Signals

Inspect outbound links to external domains.

Prioritize links that appear to support claims,
such as:

- press
- certification
- award
- review
- publication
- official organization

Do not count unrelated social links or generic
navigation links as corroboration.

---

## 7. False Positive Control

Do not report a page as stale solely because:

- its footer contains an old copyright year
- it has no publication date
- the page is short
- the page is static
- the crawler cannot find external references

unless additional evidence supports the finding.

---

## 8. Evidence

Every finding must contain:

- id
- category
- title
- severity
- confidence
- evidence
- impact
- suggested_action
- source_url