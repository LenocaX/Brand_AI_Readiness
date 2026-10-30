import sys
import re
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse


PROJECT_ROOT = Path(
    __file__
).resolve().parents[3]

sys.path.insert(
    0,
    str(PROJECT_ROOT)
)


from core.crawler import crawl_site
from core.findings import Finding
from core.deduplication import deduplicate_findings

DATE_PATTERNS = [

    r"\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b",

    r"\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2})\b",

    r"\b(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[-/](20\d{2})\b",

    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+\d{1,2},\s+20\d{2}\b",

    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
    r"\.?\s+\d{1,2},\s+20\d{2}\b",

    r"\b20\d{2}\b"
]

def extract_date_strings(text):

    if not text:
        return []

    results = []

    for pattern in DATE_PATTERNS:

        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE
        )

        for match in matches:

            if isinstance(
                match,
                tuple
            ):

                value = " ".join(
                    str(x)
                    for x in match
                    if x
                )

            else:

                value = str(match)

            if value not in results:

                results.append(
                    value
                )

    return results

FRESHNESS_TERMS = [

    "published",
    "publication",
    "updated",
    "last updated",
    "modified",
    "last modified",
    "reviewed",
    "latest",
    "new",
    "current",
    "effective from",
    "valid until"
]

def has_freshness_language(text):

    text = text.lower()

    for term in FRESHNESS_TERMS:

        if term in text:

            return True

    return False

def old_years(text):

    current_year = datetime.now().year

    years = re.findall(
        r"\b(20\d{2})\b",
        text
    )

    old = []

    for year in years:

        year = int(year)

        if year <= current_year - 3:

            old.append(
                year
            )

    return sorted(
        set(old)
    )

def check_stale_latest_claims(page):

    findings = []

    text = getattr(
        page,
        "text",
        ""
    )

    if not text:

        return findings

    lower = text.lower()

    latest_positions = []

    for term in [
        "latest",
        "current",
        "newest",
        "most recent"
    ]:

        start = 0

        while True:

            index = lower.find(
                term,
                start
            )

            if index == -1:
                break

            latest_positions.append(
                index
            )

            start = index + len(term)

    if not latest_positions:

        return findings

    years = old_years(
        text
    )

    if not years:

        return findings

    findings.append(

        Finding(

            id="FC-001",

            category="freshness_corroboration",

            title="Time-sensitive claim may rely on outdated information",

            severity="medium",

            confidence=0.78,

            evidence=(
                f"The page {page.url} uses currentness-related "
                f"language such as 'latest' or 'current' while "
                f"also containing older year references: "
                f"{years}."
            ),

            impact=(
                "Automated systems may interpret the page as "
                "describing current information even when some "
                "supporting information appears several years old."
            ),

            suggested_action={

                "summary":
                    "Review the time-sensitive claim and update "
                    "its supporting information. Add a clear "
                    "publication or last-updated date where "
                    "appropriate.",

                "priority":
                    "medium"
            },

            source_url=page.url
        )
    )

    return findings

def check_missing_freshness_signal(page):

    findings = []

    text = getattr(
        page,
        "text",
        ""
    )

    if not text:

        return findings

    dates = extract_date_strings(
        text
    )

    time_sensitive_terms = [

        "latest",
        "current",
        "recent",
        "new",
        "updated",
        "this year",
        "today",
        "now"
    ]

    lower = text.lower()

    has_time_sensitive_claim = any(
        term in lower
        for term in time_sensitive_terms
    )

    if (
        has_time_sensitive_claim
        and not dates
        and not has_freshness_language(text)
    ):

        findings.append(

            Finding(

                id="FC-002",

                category="freshness_corroboration",

                title="Freshness of time-sensitive content cannot be established",

                severity="low",

                confidence=0.82,

                evidence=(
                    f"The page {page.url} contains "
                    f"time-sensitive language but no detectable "
                    f"publication, modification, or update date."
                ),

                impact=(
                    "Readers and automated systems may have "
                    "difficulty determining whether the "
                    "time-sensitive information is current."
                ),

                suggested_action={

                    "summary":
                        "Where content is time-sensitive, expose "
                        "a clear publication or last-updated date "
                        "and review it periodically.",

                    "priority":
                        "low"
                },

                source_url=page.url
            )
        )

    return findings

def extract_external_links(page):

    html = getattr(
        page,
        "raw_html",
        ""
    )

    if not html:

        return []

    page_url = getattr(
        page,
        "url",
        ""
    )

    base_domain = urlparse(
        page_url
    ).netloc.lower()

    links = re.findall(
        r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        html,
        flags=re.IGNORECASE | re.DOTALL
    )

    external = []

    for href, anchor in links:

        href = href.strip()

        if not href.startswith(
            ("http://", "https://")
        ):

            continue

        domain = urlparse(
            href
        ).netloc.lower()

        if not domain:

            continue

        if domain == base_domain:

            continue

        anchor_text = re.sub(
            r"<[^>]+>",
            " ",
            anchor
        )

        anchor_text = re.sub(
            r"\s+",
            " ",
            anchor_text
        ).strip()

        external.append(
            {
                "url": href,
                "domain": domain,
                "anchor": anchor_text
            }
        )

    return external

CORROBORATION_TERMS = [

    "press",
    "news",
    "award",
    "certification",
    "certified",
    "review",
    "publication",
    "source",
    "study",
    "report",
    "featured",
    "recognition"
]

def likely_corroboration_link(link):

    combined = (
        link.get("anchor", "")
        + " "
        + link.get("url", "")
    ).lower()

    return any(
        term in combined
        for term in CORROBORATION_TERMS
    )

def check_corroboration(page):

    findings = []

    links = extract_external_links(
        page
    )

    if not links:

        return findings

    corroboration_links = [

        link
        for link in links
        if likely_corroboration_link(link)
    ]

    if corroboration_links:

        return findings

    text = getattr(
        page,
        "text",
        ""
    )

    lower = text.lower()

    claim_terms = [

        "award",
        "certified",
        "certification",
        "recognized",
        "leader",
        "leading",
        "largest",
        "best",
        "number one",
        "#1",
        "trusted by"
    ]

    claim_found = any(
        term in lower
        for term in claim_terms
    )

    if not claim_found:

        return findings

    findings.append(

        Finding(

            id="FC-003",

            category="freshness_corroboration",

            title="Important credibility claim has no visible corroboration reference",

            severity="medium",

            confidence=0.76,

            evidence=(
                f"The page {page.url} contains credibility-related "
                f"claims but no visible external link whose text "
                f"or URL indicates press, certification, award, "
                f"review, publication, or similar supporting evidence."
            ),

            impact=(
                "Automated systems may have less independent "
                "evidence available when evaluating or repeating "
                "the claim."
            ),

            suggested_action={

                "summary":
                    "Where the claim is independently verifiable, "
                    "link to relevant authoritative or independent "
                    "sources that substantiate the claim.",

                "priority":
                    "medium"
            },

            source_url=page.url
        )
    )

    return findings

def collect_year_signals(pages):

    signals = {}

    for page in pages:

        text = getattr(
            page,
            "text",
            ""
        )

        years = old_years(
            text
        )

        if years:

            signals[
                page.url
            ] = years

    return signals

def check_site_corroboration(pages):

    findings = []

    claim_pages = []

    for page in pages:

        text = getattr(
            page,
            "text",
            ""
        ).lower()

        claim_terms = [

            "award",
            "certified",
            "certification",
            "recognized",
            "leader",
            "leading",
            "largest",
            "best",
            "number one",
            "#1"
        ]

        if any(
            term in text
            for term in claim_terms
        ):

            claim_pages.append(
                page
            )

    if not claim_pages:

        return findings

    pages_with_external_evidence = 0

    for page in claim_pages:

        links = extract_external_links(
            page
        )

        if any(
            likely_corroboration_link(link)
            for link in links
        ):

            pages_with_external_evidence += 1

    if (
        len(claim_pages) >= 3
        and pages_with_external_evidence == 0
    ):

        findings.append(

            Finding(

                id="FC-004",

                category="freshness_corroboration",

                title="Multiple credibility claims lack visible supporting references",

                severity="medium",

                confidence=0.8,

                evidence=(
                    f"{len(claim_pages)} crawled pages contain "
                    f"credibility-related claims, but none of "
                    f"those pages contains a detected external "
                    f"reference that appears to support such claims."
                ),

                impact=(
                    "The site's important credibility claims may "
                    "have limited independently discoverable "
                    "supporting evidence."
                ),

                suggested_action={

                    "summary":
                        "For material credibility claims, add "
                        "links to relevant independent sources "
                        "such as recognized publications, "
                        "certification bodies, awards, or "
                        "independent reviews when available.",

                    "priority":
                        "medium"
                },

                source_url=claim_pages[0].url
            )
        )

    return findings

def audit_page(page):

    findings = []

    findings.extend(
        check_stale_latest_claims(
            page
        )
    )

    findings.extend(
        check_missing_freshness_signal(
            page
        )
    )

    findings.extend(
        check_corroboration(
            page
        )
    )

    return findings

def audit_site(
    start_url: str,
    max_pages: int = 10,
    max_depth: int = 2
):

    pages, errors = crawl_site(

        start_url,

        max_pages=max_pages,

        max_depth=max_depth
    )

    findings = []

    for page in pages:

        findings.extend(
            audit_page(
                page
            )
        )

    findings.extend(
        check_site_corroboration(
            pages
        )
    )

    findings = deduplicate_findings(
        findings
    )

    return {

        "start_url":
            start_url,

        "pages_checked":
            len(pages),

        "crawl_errors":
            errors,

        "findings":
            findings
    }

def main():

    if len(sys.argv) < 2:

        print(
            "Usage:"
        )

        print(
            "python audit.py <website_url>"
        )

        return

    url = sys.argv[1]

    print(
        "\nStarting Freshness & Corroboration Audit..."
    )

    print(
        f"Website: {url}\n"
    )

    result = audit_site(
        url,
        max_pages=10,
        max_depth=2
    )

    print(
        "=========================================="
    )

    print(
        "Freshness & Corroboration Audit"
    )

    print(
        "=========================================="
    )

    print(
        f"Pages checked: "
        f"{result['pages_checked']}"
    )

    print(
        f"Findings: "
        f"{len(result['findings'])}"
    )

    for finding in result["findings"]:

        print(
            "\n------------------------------------------"
        )

        print(
            f"[{finding.severity.upper()}]"
        )

        print(
            finding.title
        )

        print(
            f"URL: {finding.source_url}"
        )

        print(
            f"Evidence: {finding.evidence}"
        )

        print(
            f"Impact: {finding.impact}"
        )

        print(
            "Suggested action: "
            f"{finding.suggested_action['summary']}"
        )


if __name__ == "__main__":

    main()