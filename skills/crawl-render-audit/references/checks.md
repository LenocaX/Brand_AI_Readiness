# Crawl & Render Audit Checks

## 1. HTTP Status

Check whether pages return successful HTTP responses.

Severity guidance:

- 2xx: healthy
- 3xx: redirect
- 4xx: client error
- 5xx: server error

Evidence should include:

- URL
- HTTP status code

---

## 2. Page Title

Check whether a page has a meaningful title.

Potential issues:

- Missing title
- Empty title
- Extremely short title

---

## 3. Meta Description

Check whether the page contains a meta description.

Potential issues:

- Missing description
- Empty description

---

## 4. H1

Check whether the page contains a primary heading.

Potential issues:

- No H1
- Multiple H1 elements

---

## 5. Internal Links

Check whether the page contains internal links that can be discovered.

Potential issue:

- Page has no internal links

---

## 6. Render Dependency

Compare:

- raw HTML text
- rendered browser text

Potential issue:

A large amount of meaningful content appears only after JavaScript rendering.

---

## 7. Page Accessibility

Check whether the page can be fetched and parsed successfully.

Potential issues:

- Request failure
- Empty response
- Invalid HTML

---

## 8. Evidence

Every finding should contain:

- finding ID
- category
- title
- severity
- confidence
- evidence
- impact
- suggested action
- source URL