import json
from pathlib import Path


REQUIRED_FIELDS = [
    "site",
    "audited_at",
    "readiness",
    "engagement",
    "summary",
    "severity_summary",
    "category_summary",
    "recommendations",
    "findings",
    "priority_actions"
]


def validate_report(report):

    errors = []

    for field in REQUIRED_FIELDS:

        if field not in report:
            errors.append(
                f"Missing required field: {field}"
            )

    if "readiness" in report:

        readiness = report["readiness"]

        if "score" not in readiness:
            errors.append(
                "Missing readiness score"
            )

        if "label" not in readiness:
            errors.append(
                "Missing readiness label"
            )

    if "engagement" in report:

        engagement = report["engagement"]

        if "score" not in engagement:
            errors.append(
                "Missing engagement score"
            )

        if "label" not in engagement:
            errors.append(
                "Missing engagement label"
            )

        if "dimensions" not in engagement:
            errors.append(
                "Missing engagement dimensions"
            )

    if "summary" in report:

        summary = report["summary"]

        if "total_findings" not in summary:
            errors.append(
                "Missing total_findings"
            )

        if "pages_checked" not in summary:
            errors.append(
                "Missing pages_checked"
            )

    return errors


def validate_report_file(path):

    path = Path(path)

    if not path.exists():

        return [
            f"Report does not exist: {path}"
        ]

    try:

        with path.open(
            "r",
            encoding="utf-8"
        ) as file:

            report = json.load(file)

    except json.JSONDecodeError as error:

        return [
            f"Invalid JSON: {error}"
        ]

    return validate_report(report)


if __name__ == "__main__":

    report_path = (
        Path(__file__).resolve().parents[1]
        / "reports"
        / "audit_report.json"
    )

    errors = validate_report_file(
        report_path
    )

    if errors:

        print("REPORT VALIDATION FAILED")

        for error in errors:
            print(f"- {error}")

        raise SystemExit(1)

    print(
        "REPORT VALIDATION PASSED"
    )