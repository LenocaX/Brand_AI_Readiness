import site
import sys
import os
import json
import importlib.util
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
from urllib.parse import urlparse

# Reconfigure stdout and stderr for UTF-8 with error replacement
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

PROJECT_ROOT = Path(
    __file__
).resolve().parents[3]

sys.path.insert(
    0,
    str(PROJECT_ROOT)
)


from core.severity import calculate_priority

from core.scoring import (
    calculate_readiness_score,
    calculate_severity_summary,
    calculate_category_summary,
    get_readiness_label,
)

from core.recommendations import (
    generate_recommendations,
)

from core.engagement_score import (
    calculate_engagement_score,
    calculate_dimension_scores,
    get_engagement_label,
)

from core.validate_report import validate_report

from core.url_utils import (
    validate_url,
    get_domain,
)

def load_audit_function(folder_name):
    audit_file = (
        PROJECT_ROOT
        / "skills"
        / folder_name
        / "scripts"
        / "audit.py"
    )

    spec = importlib.util.spec_from_file_location(
        f"{folder_name}_audit_module",
        audit_file
    )

    if spec is None or spec.loader is None:
        raise ImportError(
            f"Could not load audit module: {audit_file}"
        )

    module = importlib.util.module_from_spec(spec)

    spec.loader.exec_module(module)

    return module.audit_site

crawl_audit = load_audit_function(
    "crawl-render-audit"
)

structured_data_audit = load_audit_function(
    "structured-data-audit"
)

content_extractability_audit = load_audit_function(
    "content-extractability"
)

freshness_audit = load_audit_function(
    "freshness-corroboration"
)

engagement_audit = load_audit_function(
    "engagement-audit"
)

def run_specialist(
    name,
    function,
    url
):

    print(
        f"\nRunning {name}...",
        flush=True
    )

    try:

        result = function(
            url,
            max_pages=5,
            max_depth=1
        )

        print(
            f"{name} completed.",
            flush=True
        )

        return result, "completed"

    except Exception as error:

        print(
            f"{name} failed: {error}",
            flush=True
        )

        return {
            "start_url": url,
            "pages_checked": 0,
            "crawl_errors": [
                str(error)
            ],
            "findings": [
                {
                    "id": (
                        f"ORCH-{name.upper()}-001"
                    ),
                    "severity": "medium",
                    "category": "orchestration",
                    "title": (
                        f"{name} audit failed"
                    ),
                    "confidence": 1.0,
                    "source_url": url,
                    "evidence": str(error),
                    "impact": (
                        "This specialist audit "
                        "could not complete."
                    ),
                    "suggested_action": {
                        "summary": (
                            f"Investigate the "
                            f"{name} audit error."
                        )
                    }
                }
            ]
        }, "failed"

def run_all_audits(url):

    results = {}

    results["crawl_render"], crawl_status = run_specialist(
    "Crawl / Render Audit",
    crawl_audit,
    url
    )

    results["structured_data"], structured_status = run_specialist(
    "Structured Data Audit",
    structured_data_audit,
    url
    )

    results["content_extractability"], content_status = run_specialist(
    "Content Extractability Audit",
    content_extractability_audit,
    url
    )

    results["freshness"], freshness_status = run_specialist(
    "Freshness & Corroboration Audit",
    freshness_audit,
    url
    )

    results["engagement"], engagement_status = run_specialist(
    "Engagement Audit",
    engagement_audit,
    url
    )

    audit_status = {
    "crawl": crawl_status,
    "structured_data": structured_status,
    "content_extractability": content_status,
    "freshness": freshness_status,
    "engagement": engagement_status
    }

    results["specialist_status"] = audit_status

    return results

def collect_findings(results):

    findings = []

    for result in results.values():

        result_findings = result.get(
            "findings",
            []
        )

        findings.extend(
            result_findings
        )

    for finding in findings:

        severity = getattr(
            finding,
            "severity",
            "LOW"
        )

        confidence = getattr(
            finding,
            "confidence",
            0.0
        )

        finding.priority = calculate_priority(
            severity,
            confidence
        )

    return findings

def finding_to_dict(finding):

    if isinstance(
        finding,
        dict
    ):

        return finding

    result = {}

    for field in [
        "id",
        "category",
        "title",
        "severity",
        "confidence",
        "evidence",
        "impact",
        "suggested_action",
        "source_url"
    ]:

        result[field] = getattr(
            finding,
            field,
            None
        )

    return result

def normalize_findings(findings):

    normalized = []

    for finding in findings:

        normalized.append(
            finding_to_dict(
                finding
            )
        )

    return normalized

from core.deduplication import deduplicate_findings
def deduplicate_normalized_findings(
    findings
):

    try:

        return deduplicate_findings(
            findings
        )

    except Exception:

        return findings

def severity_summary(findings):

    counter = Counter()

    for finding in findings:

        severity = finding.get(
            "severity",
            "info"
        )

        counter[
            severity
        ] += 1

    return dict(
        counter
    )

def category_summary(findings):

    counter = Counter()

    for finding in findings:

        category = finding.get(
            "category",
            "uncategorized"
        )

        counter[
            category
        ] += 1

    return dict(
        counter
    )

def validate_findings(findings):

    valid = []

    required_fields = [
        "id",
        "title",
        "severity",
        "evidence",
        "suggested_action"
    ]

    for finding in findings:

        missing = [
            field
            for field in required_fields
            if not finding.get(field)
        ]

        if missing:
            continue

        valid.append(
            finding
        )

    return valid

def build_report(
    url,
    results,
    findings
):

    parsed = urlparse(url)

    site = parsed.netloc or parsed.path

    severity_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0
    }

    for finding in findings:

        severity = str(
            finding.get(
                "severity",
                "info"
            )
        ).lower()

        if severity not in severity_counts:
            severity = "info"

        severity_counts[severity] += 1

    pages_checked = max(
        (
            result.get(
                "pages_checked",
                0
            )
            for result in results.values()
        ),
        default=0
    )

    crawl_errors = []

    for result in results.values():
        if isinstance(result, dict):
            crawl_errors.extend(
                result.get(
                    "crawl_errors",
                    []
                )
            )

    readiness_score = calculate_readiness_score(
        findings
    )

    readiness_label = get_readiness_label(
        readiness_score
    )

    engagement_score = calculate_engagement_score(
    findings
    )

    engagement_dimensions = calculate_dimension_scores(
        findings
    )

    engagement_label = get_engagement_label(
        engagement_score
    )

    severity_summary = calculate_severity_summary(
        findings
    )

    category_summary = calculate_category_summary(
        findings
    )

    recommendations = generate_recommendations(
        findings
    )

    priority_actions = []

    for finding in findings:

        priority = finding.get(
            "priority",
            "LOW"
        )

        if str(priority).upper() in ["URGENT", "HIGH"]:
            action = finding.get("suggested_action", "Review this finding.")
            if isinstance(action, dict):
                action_text = action.get("summary", "Review this finding.")
            else:
                action_text = str(action)

            priority_actions.append({
                "finding_id": finding.get("id"),
                "action": action_text,
                "priority": str(priority).lower()
            })

    report = {

        
    "site": site,
    "target_url": url,

    "audited_at": datetime.now(
        timezone.utc
    ).isoformat(),

    "specialist_status": results.get(
    "specialist_status",
    {}
    ),

    "readiness": {
        "score": readiness_score,
        "label": readiness_label,
    },

    "engagement": {
        "score": engagement_score,
        "label": engagement_label,
        "dimensions": engagement_dimensions,
    },

    "summary": {
        "total_findings": len(findings),
        "pages_checked": pages_checked,
        "crawl_errors": len(crawl_errors),
    },

    "severity_summary": severity_summary,

    "category_summary": category_summary,

    "priority_actions": priority_actions,

    "recommendations": recommendations,

    "findings": findings,
}


    validation_errors = validate_report(
        report
    )

    if validation_errors:

        print(
            "\nREPORT VALIDATION FAILED"
        )

        for error in validation_errors:

            print(
                f"- {error}"
            )

        raise RuntimeError(
            "Final audit report failed validation."
        )

    return report


def save_json_report(
    report,
    output_path
):

    output_path = Path(
        output_path
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            report,
            file,
            indent=2,
            ensure_ascii=False
        )

def safe_print(text=""):
    try:
        print(text)
    except Exception:
        try:
            encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
            clean_text = str(text).encode(encoding, errors="replace").decode(encoding)
            sys.stdout.write(clean_text + "\n")
            sys.stdout.flush()
        except Exception:
            pass

def print_report(report):

    safe_print(
        "\n"
        + "=" * 60
    )

    safe_print(
        "BRAND AI READINESS AUDIT"
    )

    safe_print(
        "=" * 60
    )

    safe_print(
        f"Target URL: "
        f"{report['site']}"
    )

    readiness = report.get(
    "readiness",
    {}
    )

    safe_print(
        f"AI Readiness Score: "
        f"{readiness.get('score', 0)}/100"
    )

    safe_print(
        f"Readiness Level: "
        f"{readiness.get('label', 'Unknown')}"
    )

    engagement = report.get(
    "engagement",
    {}
    )

    safe_print(
        f"On-Site Engagement Readiness: "
        f"{engagement.get('score', 0)}/100"
    )

    safe_print(
        f"Engagement Level: "
        f"{engagement.get('label', 'Unknown')}"
    )

    safe_print(
    "\nEngagement Dimensions:"
    )

    for dimension, score in engagement.get(
        "dimensions",
        {}
    ).items():

        safe_print(
            f"  {dimension}: {score}/100"
        )

    safe_print(
        f"Pages checked: "
        f"{report['summary']['pages_checked']}"
    )

    safe_print(
        f"Total findings: "
        f"{report['summary']['total_findings']}"
    )

    safe_print("\nPRIORITY ACTIONS")
    safe_print("-" * 60)

    for action in report.get("priority_actions", []):

        safe_print(
            f"[{action['priority']}] "
            f"{action['finding_id']}"
        )

        safe_print(
            f"Action: "
            f"{action['action']}"
        )

    safe_print(
        "\nSeverity Summary:"
    )

    for severity in [
        "critical",
        "high",
        "medium",
        "low",
        "info"
    ]:

        count = report.get(
            "severity_summary",
            {}
        ).get(
            severity,
            0
        )

        safe_print(
            f"  {severity}: {count}"
        )

    safe_print(
        "\nFindings:"
    )

    for index, finding in enumerate(
        report["findings"],
        start=1
    ):

        safe_print(
            "\n"
            + "-" * 60
        )

        safe_print(
            f"{index}. "
            f"[{finding.get('severity', 'info').upper()}] "
            f"{finding.get('title', '')}"
        )

        safe_print(
            f"ID: "
            f"{finding.get('id', '')}"
        )

        safe_print(
            f"Category: "
            f"{finding.get('category', '')}"
        )

        safe_print(
            f"Priority: "
            f"{finding.get('priority', 'LOW')}"
        )

        safe_print(
            f"Confidence: "
            f"{finding.get('confidence', '')}"
        )

        safe_print(
            f"URL: "
            f"{finding.get('source_url', '')}"
        )

        safe_print(
            f"Evidence: "
            f"{finding.get('evidence', '')}"
        )

        safe_print(
            f"Impact: "
            f"{finding.get('impact', '')}"
        )

        action = finding.get(
            "suggested_action",
            {}
        )

        if isinstance(
            action,
            dict
        ):

            action_text = action.get(
                "summary",
                ""
            )

        else:

            action_text = str(
                action
            )

        safe_print(
            f"Suggested action: "
            f"{action_text}"
        )

        safe_print(
    "\nRecommendations:"
)

    for index, recommendation in enumerate(
        report.get("recommendations", []),
        start=1
    ):

        safe_print(
            "\n"
            + "-" * 60
        )

        safe_print(
            f"{index}. "
            f"[{recommendation['priority'].upper()}] "
            f"{recommendation['title']}"
        )

        safe_print(
            f"Action: "
            f"{recommendation['action']}"
        )

        safe_print(
            f"Finding ID: "
            f"{recommendation['finding_id']}"
        )

def main():

    if len(sys.argv) < 2:

        print(
            "Usage:"
        )

        print(
            "python skills/audit_orchestrator/scripts/audit.py "
            "<website_url>"
        )

        return 1

    url = sys.argv[1]

    results = run_all_audits(
        url
    )

    all_findings = collect_findings(
        results
    )

    normalized = normalize_findings(
    all_findings
)

    normalized = deduplicate_normalized_findings(
        normalized
    )

    normalized = validate_findings(
        normalized
    )

    report = build_report(
        url,
        results,
        normalized
    )

    if len(sys.argv) > 2 and sys.argv[2]:
        output_path = Path(sys.argv[2]).resolve()
    else:
        output_path = (
            PROJECT_ROOT
            / "reports"
            / "audit_report.json"
        )

    save_json_report(
        report,
        output_path
    )

    print_report(
        report
    )

    print(
        "\nJSON report saved to:"
    )

    print(
        output_path
    )

    if report.get("summary", {}).get("pages_checked", 0) == 0:
        print(
            "\nERROR: No pages could be crawled or accessed. Target URL is unreachable.",
            file=sys.stderr,
            flush=True,
        )
        if output_path.exists():
            try:
                output_path.unlink()
            except OSError:
                pass
        return 1

    return 0


if __name__ == "__main__":

    raise SystemExit(
        main()
    )