import sys
from pathlib import Path
from typing import List
# Add project root to Python path
PROJECT_ROOT = Path(
    __file__
).resolve().parents[3]

sys.path.insert(
    0,
    str(PROJECT_ROOT)
)
from core.crawler import crawl_site
from core.renderer import render_page
from core.findings import Finding
from core.severity import normalize_severity
from core.deduplication import deduplicate_findings

def check_http_status(page):
    """
    Check whether the page returned
    an HTTP error status.
    """

    findings = []

    if page.status_code >= 500:

        findings.append(
            Finding(

                id="CR-HTTP-001",

                category="crawlability",

                title="Server error detected",

                severity="high",

                confidence=1.0,

                evidence=(
                    f"{page.url} returned "
                    f"HTTP {page.status_code}."
                ),

                impact=(
                    "Users and automated systems "
                    "may be unable to access this page."
                ),

                suggested_action={
                    "summary":
                        "Investigate and resolve the server error.",
                    "priority":
                        "high"
                },

                source_url=page.url
            )
        )

    elif page.status_code >= 400:

        findings.append(
            Finding(

                id="CR-HTTP-002",

                category="crawlability",

                title="Client error detected",

                severity="medium",

                confidence=1.0,

                evidence=(
                    f"{page.url} returned "
                    f"HTTP {page.status_code}."
                ),

                impact=(
                    "The requested page may not be "
                    "accessible to users or automated systems."
                ),

                suggested_action={
                    "summary":
                        "Verify the URL and resolve the client error.",
                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    return findings

def check_title(page):
    """
    Check whether the page has a title.
    """

    findings = []

    if not page.title.strip():

        findings.append(
            Finding(

                id="CR-TITLE-001",

                category="metadata",

                title="Missing page title",

                severity="medium",

                confidence=1.0,

                evidence=(
                    f"No <title> element was "
                    f"detected on {page.url}."
                ),

                impact=(
                    "The page has less descriptive "
                    "metadata available to automated systems."
                ),

                suggested_action={
                    "summary":
                        "Add a meaningful HTML title.",
                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    return findings

def check_description(page):
    """
    Check whether the page has a meta description.
    """

    findings = []

    if not page.description.strip():

        findings.append(
            Finding(

                id="CR-DESC-001",

                category="metadata",

                title="Missing meta description",

                severity="low",

                confidence=1.0,

                evidence=(
                    f"No meta description was "
                    f"detected on {page.url}."
                ),

                impact=(
                    "The page provides less explicit "
                    "summary metadata."
                ),

                suggested_action={
                    "summary":
                        "Add a concise meta description "
                        "that accurately summarizes the page.",
                    "priority":
                        "low"
                },

                source_url=page.url
            )
        )

    return findings

def check_h1(page):
    """
    Check whether the page has an H1 heading.
    """

    findings = []

    h1_count = sum(
        1
        for heading in page.headings
        if heading.get("level") == "h1"
    )

    if h1_count == 0:

        findings.append(
            Finding(

                id="CR-H1-001",

                category="content_structure",

                title="Missing H1 heading",

                severity="low",

                confidence=1.0,

                evidence=(
                    f"No <h1> element was detected "
                    f"on {page.url}."
                ),

                impact=(
                    "The page lacks an explicit primary "
                    "heading in its HTML structure."
                ),

                suggested_action={
                    "summary":
                        "Add a descriptive H1 that clearly "
                        "identifies the page's main topic.",
                    "priority":
                        "low"
                },

                source_url=page.url
            )
        )

    elif h1_count > 1:

        findings.append(
            Finding(

                id="CR-H1-002",

                category="content_structure",

                title="Multiple H1 headings detected",

                severity="low",

                confidence=1.0,

                evidence=(
                    f"{page.url} contains "
                    f"{h1_count} H1 elements."
                ),

                impact=(
                    "Multiple primary headings may make "
                    "the page's content hierarchy less explicit."
                ),

                suggested_action={
                    "summary":
                        "Review the heading hierarchy and "
                        "ensure the primary topic is clearly represented.",
                    "priority":
                        "low"
                },

                source_url=page.url
            )
        )

    return findings

def check_internal_links(page, start_url):
    """
    Check whether a page contains internal links.
    """

    from urllib.parse import urlparse

    findings = []

    base_domain = urlparse(
        start_url
    ).netloc

    internal_links = []

    for link in page.links:

        if urlparse(link).netloc == base_domain:

            internal_links.append(
                link
            )

    if (
        len(internal_links) == 0
        and len(page.links) > 0
    ):

        findings.append(
            Finding(

                id="CR-LINK-001",

                category="crawlability",

                title="No internal links detected",

                severity="low",

                confidence=0.9,

                evidence=(
                    f"The page contains "
                    f"{len(page.links)} link(s), "
                    f"but none point to the site's "
                    f"own domain."
                ),

                impact=(
                    "Important pages may be harder "
                    "to discover through internal navigation."
                ),

                suggested_action={
                    "summary":
                        "Review internal linking between "
                        "important pages.",
                    "priority":
                        "low"
                },

                source_url=page.url
            )
        )

    return findings

def check_rendering(page):
    """
    Compare raw HTML content with browser-rendered content.
    """

    findings = []

    result = render_page(
        page.url
    )

    if not result["success"]:

        findings.append(
            Finding(

                id="CR-RENDER-001",

                category="rendering",

                title="Browser rendering failed",

                severity="medium",

                confidence=1.0,

                evidence=(
                    f"Browser rendering failed for "
                    f"{page.url}. "
                    f"Error: {result.get('error', 'unknown')}"
                ),

                impact=(
                    "The rendered state could not be "
                    "verified by the audit."
                ),

                suggested_action={
                    "summary":
                        "Investigate browser rendering "
                        "errors and client-side dependencies.",
                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

        return findings

    rendered_text = (
        result["text"] or ""
    ).strip()

    raw_text = (
        page.raw_text or ""
    ).strip()

    raw_length = len(raw_text)

    rendered_length = len(
        rendered_text
    )

    if (
        rendered_length > 1000
        and rendered_length > raw_length * 3
    ):

        findings.append(
            Finding(

                id="CR-RENDER-002",

                category="rendering",

                title=(
                    "Significant content appears "
                    "after browser rendering"
                ),

                severity="medium",

                confidence=0.85,

                evidence=(
                    f"Raw HTML text length: "
                    f"{raw_length} characters. "
                    f"Rendered text length: "
                    f"{rendered_length} characters."
                ),

                impact=(
                    "A substantial portion of visible "
                    "content may depend on client-side "
                    "JavaScript execution."
                ),

                suggested_action={
                    "summary":
                        "Review important content that "
                        "is only available after JavaScript "
                        "execution and consider making "
                        "critical information available "
                        "in the initial HTML.",
                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    return findings

def audit_site(
    start_url: str,
    max_pages: int = 10,
    max_depth: int = 2
):
    """
    Run the Crawl & Render audit.
    """

    findings: List[Finding] = []

    pages, errors = crawl_site(

        start_url,

        max_pages=max_pages,

        max_depth=max_depth
    )

    # -------------------------
    # Crawl errors
    # -------------------------

    for error in errors:

        findings.append(
            Finding(

                id="CR-CRAWL-001",

                category="crawlability",

                title="Crawl error encountered",

                severity="medium",

                confidence=1.0,

                evidence=error,

                impact=(
                    "The audit could not access "
                    "or analyze a page."
                ),

                suggested_action={
                    "summary":
                        "Investigate the reported "
                        "crawl error.",
                    "priority":
                        "medium"
                },

                source_url=start_url
            )
        )

    # -------------------------
    # Page checks
    # -------------------------

    rendered_count = 0
    for page in pages:

        findings.extend(
            check_http_status(page)
        )

        findings.extend(
            check_title(page)
        )

        findings.extend(
            check_description(page)
        )

        findings.extend(
            check_h1(page)
        )

        findings.extend(
            check_internal_links(
                page,
                start_url
            )
        )

        if rendered_count < 2:
            findings.extend(
                check_rendering(page)
            )
            rendered_count += 1

    # -------------------------
    # Remove duplicates
    # -------------------------

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
        "\nStarting Crawl & Render Audit..."
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
        "================================"
    )

    print(
        "Crawl & Render Audit"
    )

    print(
        "================================"
    )

    print(
        f"Pages checked: "
        f"{result['pages_checked']}"
    )

    print(
        f"Crawl errors: "
        f"{len(result['crawl_errors'])}"
    )

    print(
        f"Findings: "
        f"{len(result['findings'])}"
    )

    print(
        "\nFindings:"
    )

    for finding in result["findings"]:

        print(
            "\n--------------------------------"
        )

        print(
            f"[{normalize_severity(finding.severity).upper()}]"
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