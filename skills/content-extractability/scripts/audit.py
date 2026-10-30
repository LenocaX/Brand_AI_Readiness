import sys
from pathlib import Path
import re

from core.url_utils import validate_url



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

def normalize_text(text):

    if not text:
        return ""

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()

def word_count(text):

    text = normalize_text(
        text
    )

    if not text:
        return 0

    return len(
        text.split()
    )

def check_low_text_content(page):

    findings = []

    text = normalize_text(
        getattr(
            page,
            "text",
            ""
        )
    )

    words = word_count(
        text
    )

    if words == 0:

        findings.append(
            Finding(

                id="CE-001",

                category="content_extractability",

                title="No meaningful readable text detected",

                severity="high",

                confidence=0.95,

                evidence=(
                    f"The crawled page "
                    f"{page.url} contains no "
                    f"meaningful readable text."
                ),

                impact=(
                    "Important information may be unavailable "
                    "to automated systems that rely on "
                    "page text."
                ),

                suggested_action={

                    "summary":
                        "Expose important page information "
                        "as readable HTML text rather than "
                        "only through non-textual or "
                        "client-dependent content.",

                    "priority":
                        "high"
                },

                source_url=page.url
            )
        )

    elif words < 20:

        findings.append(
            Finding(

                id="CE-002",

                category="content_extractability",

                title="Very little readable text detected",

                severity="medium",

                confidence=0.85,

                evidence=(
                    f"The crawled page "
                    f"{page.url} contains approximately "
                    f"{words} readable words."
                ),

                impact=(
                    "A page with very little machine-readable "
                    "text may provide insufficient explicit "
                    "context for automated systems."
                ),

                suggested_action={

                    "summary":
                        "Ensure the page explicitly states "
                        "its main purpose, key facts, entities, "
                        "and user-relevant information in "
                        "readable HTML text.",

                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    return findings

def check_image_alt_text(page):

    findings = []

    images = getattr(
        page,
        "images",
        []
    )

    if not images:
        return findings

    missing_alt = 0
    total_images = 0

    for image in images:

        if not isinstance(
            image,
            dict
        ):
            continue

        total_images += 1

        alt = image.get(
            "alt",
            ""
        )

        if not isinstance(
            alt,
            str
        ):

            alt = ""

        if not alt.strip():

            missing_alt += 1

    if (
        total_images >= 3
        and missing_alt == total_images
    ):

        findings.append(
            Finding(

                id="CE-IMG-001",

                category="content_extractability",

                title="All detected images lack alternative text",

                severity="medium",

                confidence=0.9,

                evidence=(
                    f"The page {page.url} contains "
                    f"{total_images} detected images and "
                    f"none has non-empty alt text."
                ),

                impact=(
                    "If any of these images contain meaningful "
                    "information, that information may not be "
                    "available as explicit text."
                ),

                suggested_action={

                    "summary":
                        "Add concise, accurate alternative "
                        "text to informative images and keep "
                        "decorative images appropriately marked "
                        "as decorative.",

                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    elif (
        total_images >= 5
        and missing_alt / total_images >= 0.8
    ):

        findings.append(
            Finding(

                id="CE-IMG-002",

                category="content_extractability",

                title="Most detected images lack alternative text",

                severity="low",

                confidence=0.85,

                evidence=(
                    f"The page {page.url} contains "
                    f"{total_images} images, of which "
                    f"{missing_alt} have no non-empty alt text."
                ),

                impact=(
                    "Informative visual content may be harder "
                    "for automated systems to interpret."
                ),

                suggested_action={

                    "summary":
                        "Review images and provide accurate "
                        "alt text for images that communicate "
                        "meaningful information.",

                    "priority":
                        "low"
                },

                source_url=page.url
            )
        )

    return findings

def check_heading_context(page):

    findings = []

    headings = getattr(
        page,
        "headings",
        []
    )

    text = normalize_text(
        getattr(
            page,
            "text",
            ""
        )
    )

    if not headings:
        return findings

    if word_count(text) > 30:
        return findings

    if len(headings) >= 3:

        findings.append(
            Finding(

                id="CE-H-001",

                category="content_extractability",

                title="Page has headings but very little supporting text",

                severity="medium",

                confidence=0.8,

                evidence=(
                    f"The page {page.url} contains "
                    f"{len(headings)} headings but only "
                    f"{word_count(text)} readable words."
                ),

                impact=(
                    "The page structure suggests multiple "
                    "topics or sections, but there is little "
                    "machine-readable explanatory content "
                    "supporting those sections."
                ),

                suggested_action={

                    "summary":
                        "Add concise, explicit text beneath "
                        "important headings explaining the "
                        "corresponding topic, service, product, "
                        "or other entity.",

                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    return findings

def check_tables(page):

    findings = []

    raw_html = getattr(
        page,
        "raw_html",
        ""
    )

    if not raw_html:
        return findings

    table_count = len(
        re.findall(
            r"<table\b",
            raw_html,
            flags=re.IGNORECASE
        )
    )

    if table_count == 0:
        return findings

    text = normalize_text(
        getattr(
            page,
            "text",
            ""
        )
    )

    words = word_count(
        text
    )

    if (
        table_count >= 3
        and words < 50
    ):

        findings.append(
            Finding(

                id="CE-TABLE-001",

                category="content_extractability",

                title="Multiple tables with limited surrounding text",

                severity="low",

                confidence=0.75,

                evidence=(
                    f"The page {page.url} contains "
                    f"{table_count} tables but only "
                    f"{words} readable words."
                ),

                impact=(
                    "Important information may depend heavily "
                    "on visually interpreting tabular content "
                    "with limited textual context."
                ),

                suggested_action={

                    "summary":
                        "Provide clear textual context and "
                        "descriptions for important tabular "
                        "information.",

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
        check_low_text_content(
            page
        )
    )

    findings.extend(
        check_image_alt_text(
            page
        )
    )

    findings.extend(
        check_heading_context(
            page
        )
    )

    findings.extend(
        check_tables(
            page
        )
    )

    return findings

def audit_site(
    start_url: str,
    max_pages: int = 10,
    max_depth: int = 2
):
    
    start_url = validate_url(start_url)

    if start_url is None:
        raise ValueError(
            "Invalid website URL."
        )


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

def run_specialist_safely(
    audit_name,
    audit_function,
    site,
):
    """
    Run a specialist audit without
    crashing the complete pipeline.
    """

    try:

        result = audit_function(site)

        if result is None:
            return []

        if not isinstance(result, list):
            return [result]

        return result

    except Exception as error:

        print(
            f"\n[{audit_name}] FAILED"
        )

        print(
            f"Error: {error}"
        )

        return [
            {
                "id": f"ORCH-{audit_name.upper()}-001",
                "severity": "medium",
                "category": "orchestration",
                "title": (
                    f"{audit_name} audit failed"
                ),
                "confidence": 1.0,
                "source_url": site,
                "evidence": str(error),
                "impact": (
                    "This specialist audit "
                    "could not complete."
                ),
                "suggested_action": {
                    "summary": (
                        f"Investigate the "
                        f"{audit_name} audit error."
                    )
                },
            }
        ]

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
        "\nStarting Content Extractability Audit..."
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
        "Content Extractability Audit"
    )

    print(
        "================================"
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
            "\n--------------------------------"
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