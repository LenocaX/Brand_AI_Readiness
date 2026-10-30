# Structured Data Audit Checks

## 1. JSON-LD Detection

Detect JSON-LD scripts using:

    <script type="application/ld+json">

Record:

- number of JSON-LD blocks
- schema types
- page URL

---

## 2. Schema Type Detection

Identify common Schema.org types such as:

- Organization
- LocalBusiness
- Product
- Offer
- Article
- NewsArticle
- BlogPosting
- BreadcrumbList
- FAQPage
- Person
- WebSite
- WebPage

---

## 3. Organization Data

For organization pages, inspect whether useful identity
information is represented.

Potential fields:

- name
- url
- logo
- sameAs

---

## 4. Product Data

For product pages, inspect:

- name
- description
- image
- offers
- price
- priceCurrency
- availability

---

## 5. Article Data

For article-like pages, inspect:

- headline
- author
- datePublished
- dateModified
- image

---

## 6. Breadcrumb Data

Check BreadcrumbList for:

- itemListElement
- position
- name
- item

---

## 7. Invalid JSON-LD

Detect JSON-LD blocks that cannot be parsed as JSON.

---

## 8. Missing Important Fields

Only report missing fields when the detected schema type
makes those fields relevant.

Avoid treating every missing optional property as an error.

---

## 9. Evidence

Every finding must include:

- finding ID
- title
- severity
- confidence
- evidence
- impact
- suggested action
- source URL