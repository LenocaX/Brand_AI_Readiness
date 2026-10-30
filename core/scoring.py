from collections import Counter


SEVERITY_WEIGHTS = {
    "critical": 20,
    "high": 10,
    "medium": 5,
    "low": 2,
    "info": 0,
}


CATEGORY_WEIGHTS = {
    "crawl": 20,
    "render": 20,
    "structured_data": 20,
    "content": 20,
    "freshness": 10,
    "engagement": 10,
}


def calculate_severity_penalty(findings):
    """
    Calculate the score penalty based on finding severity.
    """

    penalty = 0

    for finding in findings:

        severity = str(
            finding.get("severity", "info")
        ).lower()

        penalty += SEVERITY_WEIGHTS.get(
            severity,
            0
        )

    return penalty


def calculate_readiness_score(findings):
    """
    Calculate an overall AI readiness score from 0 to 100.
    """

    penalty = calculate_severity_penalty(
        findings
    )

    score = 100 - penalty

    return max(
        0,
        min(
            100,
            score
        )
    )


def calculate_severity_summary(findings):
    """
    Count findings by severity.
    """

    counter = Counter()

    for finding in findings:

        severity = str(
            finding.get("severity", "info")
        ).lower()

        counter[severity] += 1

    return {
        "critical": counter.get("critical", 0),
        "high": counter.get("high", 0),
        "medium": counter.get("medium", 0),
        "low": counter.get("low", 0),
        "info": counter.get("info", 0),
    }


def calculate_category_summary(findings):
    """
    Count findings by category.
    """

    counter = Counter()

    for finding in findings:

        category = str(
            finding.get("category", "other")
        ).lower()

        counter[category] += 1

    return dict(counter)


def get_readiness_label(score):
    """
    Convert numerical score into a human-readable rating.
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