# Content Extractability Checks

## 1. Readable Text

Inspect the amount of meaningful text available to automated readers.

Check for:

- very low text content
- extremely short pages
- navigation-heavy pages
- pages containing mostly markup with little useful text

Do not automatically classify every short page as a problem.

---

## 2. Text-to-Structure Relationship

Compare:

- headings
- paragraphs
- links
- images
- tables

Look for pages where important structural elements exist
without sufficient explanatory text.

---

## 3. Image-Only Information

Detect images that may contain important information.

Examples:

- product information
- pricing
- contact information
- service descriptions
- location information
- important instructions

Do not assume every image contains important information.

---

## 4. Image Alt Text

Inspect image alt attributes.

Potential problem:

- meaningful image has empty alt text
- informative image has missing alt text

Decorative images may legitimately have empty alt text.

---

## 5. Tables

Detect tables and inspect whether the page contains
supporting textual context.

Tables containing important facts should be understandable
without relying solely on visual interpretation.

---

## 6. Heading Context

Inspect whether headings are followed by useful content.

Potential problem:

- heading exists
- little or no explanatory content follows it

Avoid flagging navigation menus as content sections.

---

## 7. Entity / Fact Clarity

Important facts should be stated explicitly.

Examples:

- what the company does
- what product is being offered
- where the business operates
- how users can contact the business
- what services are provided

Avoid inferring facts that are not explicitly present.

---

## 8. Evidence

Every finding should include:

- finding ID
- title
- severity
- confidence
- evidence
- impact
- suggested action
- source URL

---

## 9. False Positive Control

Do not flag:

- empty utility pages
- simple legal pages
- pages whose purpose legitimately requires little text
- decorative images
- normal navigation elements

without additional evidence.