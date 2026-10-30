import sys
from pathlib import Path
from typing import List

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

def get_schema_types(
    json_ld_items
):
    """
    Extract @type values from JSON-LD objects.
    """

    types = []

    for item in json_ld_items:

        if not isinstance(
            item,
            dict
        ):
            continue

        schema_type = item.get(
            "@type"
        )

        if isinstance(
            schema_type,
            str
        ):

            types.append(
                schema_type
            )

        elif isinstance(
            schema_type,
            list
        ):

            for value in schema_type:

                if isinstance(
                    value,
                    str
                ):

                    types.append(
                        value
                    )

    return types

def has_field(
    item,
    field
):
    """
    Check whether a JSON-LD object contains
    a non-empty field.
    """

    if not isinstance(
        item,
        dict
    ):

        return False

    value = item.get(
        field
    )

    if value is None:
        return False

    if isinstance(
        value,
        str
    ):

        return bool(
            value.strip()
        )

    if isinstance(
        value,
        list
    ):

        return len(value) > 0

    if isinstance(
        value,
        dict
    ):

        return len(value) > 0

    return True

def check_invalid_json_ld(
    page
):

    findings = []

    invalid_blocks = []

    for item in page.json_ld:

        if isinstance(
            item,
            dict
        ) and "_parse_error" in item:

            invalid_blocks.append(
                item["_parse_error"]
            )

    if invalid_blocks:

        findings.append(
            Finding(

                id="SD-INVALID-001",

                category="structured_data",

                title="Invalid JSON-LD detected",

                severity="medium",

                confidence=1.0,

                evidence=(
                    f"{len(invalid_blocks)} "
                    f"JSON-LD block(s) on "
                    f"{page.url} could not be parsed."
                ),

                impact=(
                    "Malformed structured data may not "
                    "be reliably interpreted by systems "
                    "that consume JSON-LD."
                ),

                suggested_action={

                    "summary":
                        "Validate and correct the "
                        "JSON-LD syntax.",

                    "priority":
                        "medium"
                },

                source_url=page.url
            )
        )

    return findings

def check_json_ld(
    page
):

    findings = []

    if len(page.json_ld) == 0:

        findings.append(
            Finding(

                id="SD-001",

                category="structured_data",

                title="No JSON-LD structured data detected",

                severity="low",

                confidence=1.0,

                evidence=(
                    f"No JSON-LD blocks were detected "
                    f"on {page.url}."
                ),

                impact=(
                    "The page does not expose Schema.org "
                    "information through JSON-LD."
                ),

                suggested_action={

                    "summary":
                        "Consider adding appropriate "
                        "Schema.org JSON-LD where it "
                        "accurately represents the page.",

                    "priority":
                        "low"
                },

                source_url=page.url
            )
        )

    return findings

def check_organization(
    page
):

    findings = []

    for item in page.json_ld:

        if not isinstance(
            item,
            dict
        ):
            continue

        schema_type = item.get(
            "@type"
        )

        if schema_type != "Organization":
            continue

        missing = []

        for field in [
            "name",
            "url"
        ]:

            if not has_field(
                item,
                field
            ):

                missing.append(
                    field
                )

        if missing:

            findings.append(
                Finding(

                    id="SD-ORG-001",

                    category="structured_data",

                    title=(
                        "Organization structured data "
                        "is missing important identity fields"
                    ),

                    severity="medium",

                    confidence=0.95,

                    evidence=(
                        f"Organization JSON-LD on "
                        f"{page.url} is missing: "
                        f"{', '.join(missing)}."
                    ),

                    impact=(
                        "Important organization identity "
                        "information is not fully represented "
                        "in the detected Organization object."
                    ),

                    suggested_action={

                        "summary":
                            "Complete the Organization "
                            "structured data with accurate "
                            "identity information.",

                        "priority":
                            "medium"
                    },

                    source_url=page.url
                )
            )

    return findings

def check_product(
    page
):

    findings = []

    for item in page.json_ld:

        if not isinstance(
            item,
            dict
        ):
            continue

        schema_type = item.get(
            "@type"
        )

        if schema_type != "Product":
            continue

        missing = []

        if not has_field(
            item,
            "name"
        ):

            missing.append(
                "name"
            )

        if not has_field(
            item,
            "image"
        ):

            missing.append(
                "image"
            )

        if not has_field(
            item,
            "description"
        ):

            missing.append(
                "description"
            )

        if missing:

            findings.append(
                Finding(

                    id="SD-PRODUCT-001",

                    category="structured_data",

                    title=(
                        "Product structured data "
                        "is incomplete"
                    ),

                    severity="medium",

                    confidence=0.95,

                    evidence=(
                        f"Product JSON-LD on "
                        f"{page.url} is missing: "
                        f"{', '.join(missing)}."
                    ),

                    impact=(
                        "The detected Product object "
                        "does not fully describe the product."
                    ),

                    suggested_action={

                        "summary":
                            "Add accurate product information "
                            "to the Product structured data.",

                        "priority":
                            "medium"
                    },

                    source_url=page.url
                )
            )

    return findings

def check_article(
    page
):

    findings = []

    article_types = {
        "Article",
        "NewsArticle",
        "BlogPosting"
    }

    for item in page.json_ld:

        if not isinstance(
            item,
            dict
        ):
            continue

        schema_type = item.get(
            "@type"
        )

        if schema_type not in article_types:
            continue

        missing = []

        for field in [
            "headline",
            "author",
            "datePublished"
        ]:

            if not has_field(
                item,
                field
            ):

                missing.append(
                    field
                )

        if missing:

            findings.append(
                Finding(

                    id="SD-ARTICLE-001",

                    category="structured_data",

                    title=(
                        "Article structured data "
                        "is incomplete"
                    ),

                    severity="medium",

                    confidence=0.95,

                    evidence=(
                        f"{schema_type} JSON-LD on "
                        f"{page.url} is missing: "
                        f"{', '.join(missing)}."
                    ),

                    impact=(
                        "The article's machine-readable "
                        "metadata is incomplete."
                    ),

                    suggested_action={

                        "summary":
                            "Complete the article structured "
                            "data with accurate metadata.",

                        "priority":
                            "medium"
                    },

                    source_url=page.url
                )
            )

    return findings

def check_breadcrumbs(
    page
):

    findings = []

    for item in page.json_ld:

        if not isinstance(
            item,
            dict
        ):
            continue

        if item.get(
            "@type"
        ) != "BreadcrumbList":

            continue

        elements = item.get(
            "itemListElement"
        )

        if not isinstance(
            elements,
            list
        ) or len(elements) == 0:

            findings.append(
                Finding(

                    id="SD-BREAD-001",

                    category="structured_data",

                    title=(
                        "Breadcrumb structured data "
                        "has no item list"
                    ),

                    severity="low",

                    confidence=1.0,

                    evidence=(
                        f"BreadcrumbList was detected "
                        f"on {page.url}, but it does not "
                        f"contain a usable itemListElement."
                    ),

                    impact=(
                        "The breadcrumb hierarchy cannot "
                        "be clearly represented from the "
                        "detected structured data."
                    ),

                    suggested_action={

                        "summary":
                            "Add valid breadcrumb items with "
                            "positions and names.",

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
        check_invalid_json_ld(
            page
        )
    )

    findings.extend(
        check_json_ld(
            page
        )
    )

    findings.extend(
        check_organization(
            page
        )
    )

    findings.extend(
        check_product(
            page
        )
    )

    findings.extend(
        check_article(
            page
        )
    )

    findings.extend(
        check_breadcrumbs(
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
        "\nStarting Structured Data Audit..."
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
        "Structured Data Audit"
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