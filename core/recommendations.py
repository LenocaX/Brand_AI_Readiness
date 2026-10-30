def generate_recommendations(findings):
    """
    Generate prioritized recommendations from audit findings.
    """

    recommendations = []

    for finding in findings:

        severity = str(
            finding.get("severity", "info")
        ).lower()

        title = finding.get(
            "title",
            "Unnamed finding"
        )

        action = finding.get(
            "suggested_action",
            ""
        )

        if isinstance(action, dict):

            action = action.get(
                "summary",
                ""
            )

        recommendation = {
            "priority": severity,
            "finding_id": finding.get(
                "id",
                ""
            ),
            "title": title,
            "action": str(action),
            "source_url": finding.get(
                "source_url",
                ""
            ),
        }

        recommendations.append(
            recommendation
        )

    severity_order = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3,
        "info": 4,
    }

    recommendations.sort(
        key=lambda item:
        severity_order.get(
            item["priority"],
            5
        )
    )

    return recommendations