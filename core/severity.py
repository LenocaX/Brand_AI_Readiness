SEVERITY_ORDER = {

    "critical": 4,

    "high": 3,

    "medium": 2,

    "low": 1

}


def severity_rank(
    severity: str
) -> int:

    return SEVERITY_ORDER.get(
        severity.lower(),
        0
    )


def normalize_severity(
    severity: str
) -> str:

    severity = (
        severity
        .lower()
        .strip()
    )

    if severity not in SEVERITY_ORDER:

        return "medium"

    return severity

def calculate_priority(severity, confidence):
    """
    Convert severity and confidence into an actionable priority.
    """

    severity = str(severity).upper()

    if severity == "CRITICAL":
        return "URGENT"

    if severity == "HIGH":
        return "HIGH"

    if severity == "MEDIUM":
        if confidence >= 0.8:
            return "MEDIUM"

        return "LOW"

    return "LOW"