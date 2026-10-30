import sys
import re
from pathlib import Path
from urllib.parse import urlparse, urljoin


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

def get_page_text(page):

    text = getattr(
        page,
        "text",
        ""
    )

    if not text:
        return ""

    return re.sub(
        r"\s+",
        " ",
        text
    ).strip()

def get_page_html(page):

    return getattr(
        page,
        "raw_html",
        ""
    ) or getattr(
        page,
        "html",
        ""
    )

def extract_headings(page):

    html = get_page_html(
        page
    )

    if not html:
        return []

    matches = re.findall(
        r"<h([1-6])[^>]*>(.*?)</h\1>",
        html,
        flags=re.IGNORECASE | re.DOTALL
    )

    headings = []

    for level, content in matches:

        text = re.sub(
            r"<[^>]+>",
            " ",
            content
        )

        text = re.sub(
            r"\s+",
            " ",
            text
        ).strip()

        if text:

            headings.append(
                {
                    "level": int(level),
                    "text": text
                }
            )

    return headings

def extract_title(page):

    html = get_page_html(
        page
    )

    if not html:
        return ""

    match = re.search(
        r"<title[^>]*>(.*?)</title>",
        html,
        flags=re.IGNORECASE | re.DOTALL
    )

    if not match:
        return ""

    title = re.sub(
        r"<[^>]+>",
        " ",
        match.group(1)
    )

    return re.sub(
        r"\s+",
        " ",
        title
    ).strip()

def check_h1(page):

    findings = []

    headings = extract_headings(
        page
    )

    h1s = [
        h
        for h in headings
        if h["level"] == 1
    ]

    if len(h1s) == 0:

        findings.append(

            Finding(

                id="EA-001",

                category="engagement",

                title="Page has no visible H1 heading",

                severity="medium",

                confidence=0.94,

                evidence=(
                    f"The page {page.url} contains no "
                    f"detectable H1 heading."
                ),

                impact=(
                    "Visitors may have less immediate "
                    "orientation about the primary subject "
                    "of the page."
                ),

                suggested_action={

                    "summary":
                        "Add one clear, descriptive H1 that "
                        "states the main purpose or subject "
                        "of the page.",

                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    return findings

def extract_navigation(page):

    html = get_page_html(
        page
    )

    if not html:
        return []

    nav_blocks = re.findall(
        r"<nav\b[^>]*>(.*?)</nav>",
        html,
        flags=re.IGNORECASE | re.DOTALL
    )

    links = []

    for block in nav_blocks:

        matches = re.findall(
            r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
            block,
            flags=re.IGNORECASE | re.DOTALL
        )

        for href, text in matches:

            text = re.sub(
                r"<[^>]+>",
                " ",
                text
            )

            text = re.sub(
                r"\s+",
                " ",
                text
            ).strip()

            if text:

                links.append(
                    {
                        "href": href,
                        "text": text
                    }
                )

    return links

def check_navigation(page):

    findings = []

    html = get_page_html(
        page
    )

    if not html:
        return findings

    nav_links = extract_navigation(
        page
    )

    if nav_links:
        return findings

    lower = html.lower()

    has_header_links = bool(
        re.search(
            r"<header\b[^>]*>.*?<a\b",
            lower,
            flags=re.IGNORECASE | re.DOTALL
        )
    )

    if has_header_links:
        return findings

    findings.append(

        Finding(

            id="EA-002",

            category="engagement",

            title="No clear primary navigation detected",

            severity="medium",

            confidence=0.84,

            evidence=(
                f"No <nav> element containing links and "
                f"no obvious header navigation links were "
                f"detected on {page.url}."
            ),

            impact=(
                "Visitors may have difficulty discovering "
                "related sections or continuing through "
                "the website."
            ),

            suggested_action={

                "summary":
                    "Provide a clear, consistently placed "
                    "primary navigation with descriptive "
                    "links to the site's main sections.",

                "priority":
                    "medium"
            },

            source_url=page.url
        )
    )

    return findings

CTA_TERMS = [

    "get started",
    "start now",
    "buy now",
    "shop now",
    "sign up",
    "signup",
    "register",
    "request demo",
    "book demo",
    "contact us",
    "contact sales",
    "subscribe",
    "download",
    "learn more",
    "view pricing",
    "pricing",
    "try free",
    "try it free",
    "book now"
]

def extract_ctas(page):

    html = get_page_html(
        page
    )

    if not html:
        return []

    elements = re.findall(
        r"<(?:a|button)\b[^>]*>(.*?)</(?:a|button)>",
        html,
        flags=re.IGNORECASE | re.DOTALL
    )

    ctas = []

    for content in elements:

        text = re.sub(
            r"<[^>]+>",
            " ",
            content
        )

        text = re.sub(
            r"\s+",
            " ",
            text
        ).strip()

        lower = text.lower()

        if any(
            term in lower
            for term in CTA_TERMS
        ):

            ctas.append(
                text
            )

    return ctas

NON_ACTION_PAGE_TERMS = [

    "privacy",
    "terms of service",
    "terms and conditions",
    "cookie policy",
    "accessibility statement",
    "legal"
]

def is_likely_informational_or_legal(page):

    title = extract_title(
        page
    ).lower()

    text = get_page_text(
        page
    ).lower()[:1500]

    combined = title + " " + text

    return any(
        term in combined
        for term in NON_ACTION_PAGE_TERMS
    )

def check_cta(page):

    findings = []

    if is_likely_informational_or_legal(
        page
    ):

        return findings

    ctas = extract_ctas(
        page
    )

    if ctas:
        return findings

    headings = extract_headings(
        page
    )

    page_text = get_page_text(
        page
    )

    if (
        len(page_text) < 300
        and len(headings) <= 1
    ):

        return findings

    findings.append(

        Finding(

            id="EA-003",

            category="engagement",

            title="No obvious next action detected",

            severity="low",

            confidence=0.73,

            evidence=(
                f"No recognizable action-oriented link or "
                f"button was detected on {page.url}. "
                f"The page contains approximately "
                f"{len(page_text)} characters of visible text."
            ),

            impact=(
                "Visitors who reach the page may not have "
                "an obvious next step when one would be "
                "useful for the page's purpose."
            ),

            suggested_action={

                "summary":
                    "Add a contextually appropriate next action, "
                    "such as viewing a related resource, contacting "
                    "the organization, starting a workflow, or "
                    "viewing relevant product information.",

                "priority":
                    "low"
            },

            source_url=page.url
        )
    )

    return findings

def extract_internal_links(page):

    html = get_page_html(
        page
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

    matches = re.findall(
        r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        html,
        flags=re.IGNORECASE | re.DOTALL
    )

    links = []

    for href, text in matches:

        absolute = urljoin(
            page_url,
            href
        )

        parsed = urlparse(
            absolute
        )

        if parsed.netloc.lower() != base_domain:
            continue

        text = re.sub(
            r"<[^>]+>",
            " ",
            text
        )

        text = re.sub(
            r"\s+",
            " ",
            text
        ).strip()

        if not text:
            continue

        links.append(
            {
                "url": absolute.split("#")[0],
                "text": text
            }
        )

    unique = {}

    for link in links:

        unique[
            link["url"]
        ] = link

    return list(
        unique.values()
    )

def check_dead_end(page):

    findings = []

    links = extract_internal_links(
        page
    )

    nav = extract_navigation(
        page
    )

    ctas = extract_ctas(
        page
    )

    if links:
        return findings

    if nav:
        return findings

    if ctas:
        return findings

    if is_likely_informational_or_legal(
        page
    ):

        return findings

    findings.append(

        Finding(

            id="EA-004",

            category="engagement",

            title="Page appears to be a navigation dead end",

            severity="medium",

            confidence=0.88,

            evidence=(
                f"No internal links, detectable navigation "
                f"links, or recognized calls to action were "
                f"found on {page.url}."
            ),

            impact=(
                "Visitors may reach the page without an "
                "obvious path to related information or "
                "the next step in their journey."
            ),

            suggested_action={

                "summary":
                    "Add relevant internal links or a "
                    "contextually appropriate next action "
                    "that helps visitors continue their journey.",

                "priority":
                    "medium"
            },

            source_url=page.url
        )
    )

    return findings

GENERIC_LINK_TEXT = {

    "click here",
    "here",
    "read more",
    "learn more",
    "more",
    "this"
}

def check_generic_links(page):

    findings = []

    links = extract_internal_links(
        page
    )

    generic = []

    for link in links:

        text = link["text"].strip().lower()

        if text in GENERIC_LINK_TEXT:

            generic.append(
                link["text"]
            )

    if not generic:
        return findings

    if len(generic) < 2:
        return findings

    findings.append(

        Finding(

            id="EA-005",

            category="engagement",

            title="Multiple internal links use generic labels",

            severity="low",

            confidence=0.91,

            evidence=(
                f"The page {page.url} contains "
                f"{len(generic)} internal links using generic "
                f"labels such as 'click here', 'read more', "
                f"or 'learn more'."
            ),

            impact=(
                "Visitors may have to infer the destination "
                "from surrounding content instead of the "
                "link text itself."
            ),

            suggested_action={

                "summary":
                    "Replace generic link labels with concise "
                    "descriptions of the destination, such as "
                    "'View pricing plans' or 'Read the security guide'.",

                "priority":
                    "low"
            },

            source_url=page.url
        )
    )

    return findings

def check_heading_hierarchy(page):

    findings = []

    headings = extract_headings(
        page
    )

    if not headings:
        return findings

    levels = [
        h["level"]
        for h in headings
    ]

    jumps = []

    for previous, current in zip(
        levels,
        levels[1:]
    ):

        if current > previous + 1:

            jumps.append(
                (previous, current)
            )

    if not jumps:
        return findings

    findings.append(

        Finding(

            id="EA-006",

            category="engagement",

            title="Heading structure contains abrupt hierarchy jumps",

            severity="low",

            confidence=0.86,

            evidence=(
                f"The page {page.url} contains heading "
                f"level jumps such as "
                f"{jumps[:3]}."
            ),

            impact=(
                "The page structure may be harder for visitors "
                "and assistive technologies to scan and understand."
            ),

            suggested_action={

                "summary":
                    "Organize headings in a logical hierarchy, "
                    "using lower-level headings beneath the "
                    "appropriate parent section.",

                "priority":
                    "low"
            },

            source_url=page.url
        )
    )

    return findings

def audit_page(page):

    findings = []

    findings.extend(
        check_h1(page)
    )

    findings.extend(
        check_navigation(page)
    )

    findings.extend(
        check_cta(page)
    )

    findings.extend(
        check_dead_end(page)
    )

    findings.extend(
        check_generic_links(page)
    )

    findings.extend(
        check_heading_hierarchy(page)
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
        "\nStarting Engagement Audit..."
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
        "Engagement Audit"
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