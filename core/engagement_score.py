from collections import Counter


DIMENSIONS = [
    "clarity",
    "navigation",
    "orientation",
    "content_accessibility",
    "cta_clarity",
    "context_retention",
]


SEVERITY_PENALTIES = {
    "critical": 20,
    "high": 12,
    "medium": 7,
    "low": 3,
    "info": 0,
}


def get_dimension_for_finding(finding):
    
    """
    Determine which engagement dimension a finding affects.
    """

    explicit_dimension = finding.get(
        "engagement_dimension"
    )

    if explicit_dimension in DIMENSIONS:
        return explicit_dimension

    category = str(
        finding.get("category", "")
    ).lower()

    title = str(
        finding.get("title", "")
    ).lower()

    text = f"{category} {title}"

    if any(
        word in text
        for word in [
            "navigation",
            "menu",
            "breadcrumb",
            "link",
        ]
    ):
        return "navigation"

    if any(
        word in text
        for word in [
            "heading",
            "clarity",
            "unclear",
            "purpose",
        ]
    ):
        return "clarity"

    if any(
        word in text
        for word in [
            "orientation",
            "breadcrumb",
            "location",
        ]
    ):
        return "orientation"

    if any(
        word in text
        for word in [
            "content",
            "text",
            "image",
            "accessibility",
        ]
    ):
        return "content_accessibility"

    if any(
        word in text
        for word in [
            "cta",
            "call to action",
            "action",
            "button",
        ]
    ):
        return "cta_clarity"

    if any(
        word in text
        for word in [
            "context",
            "internal link",
            "related",
        ]
    ):
        return "context_retention"

    return None


def calculate_dimension_scores(findings):
    """
    Calculate a score for each engagement dimension.
    """

    penalties = {
        dimension: 0
        for dimension in DIMENSIONS
    }

    for finding in findings:

        dimension = get_dimension_for_finding(
            finding
        )

        if dimension is None:
            continue

        severity = str(
            finding.get(
                "severity",
                "info"
            )
        ).lower()

        penalty = SEVERITY_PENALTIES.get(
            severity,
            0
        )

        penalties[dimension] += penalty

    scores = {}

    for dimension in DIMENSIONS:

        scores[dimension] = max(
            0,
            min(
                100,
                100 - penalties[dimension]
            )
        )

    return scores


def calculate_engagement_score(findings):
    """
    Calculate overall On-Site Engagement Readiness.
    """

    scores = calculate_dimension_scores(
        findings
    )

    if not scores:
        return 100

    return round(
        sum(scores.values()) / len(scores)
    )


def get_engagement_label(score):
    """
    Convert engagement score into a readable label.
    """

    if score >= 90:
        return "Excellent"

    if score >= 75:
        return "Good"

    if score >= 60:
        return "Needs Improvement"

    if score >= 40:
        return "Poor"

    return "Critical"