import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from backend.database import get_db
from backend.models_db import AuditRun, AuditFinding, Website, User
from backend.schemas import AuditFindingResponse, AuditComparisonDiff
from backend.auth import get_optional_current_user
from core.robots import inspect_ai_crawlers
from core.url_utils import is_safe_public_url

router = APIRouter(prefix="/api/audits", tags=["Audits & History"])


@router.get("/crawlers/inspect")
def inspect_crawlers_endpoint(url: str = Query(...)):
    """
    Inspects robots.txt for AI crawlers: GPTBot, OAI-SearchBot, ClaudeBot,
    PerplexityBot, Google-Extended, Bytespider.
    """
    if not is_safe_public_url(url):
        raise HTTPException(status_code=400, detail="Invalid or restricted website URL.")
    return inspect_ai_crawlers(url)


def generate_finding_fingerprint(category: str, title: str, source_url: str) -> str:
    """
    Creates a normalized deterministic fingerprint for a finding.
    Enables stable before-and-after matching across multiple audit runs.
    """
    clean_key = f"{category.strip().lower()}|{title.strip().lower()}|{source_url.strip().lower()}"
    return hashlib.sha256(clean_key.encode("utf-8")).hexdigest()[:16]


def persist_audit_report_to_db(db: Session, job_id: str, target_url: str, report: Dict[str, Any], website_id: Optional[str] = None) -> AuditRun:
    """
    Saves an audit report into relational PostgreSQL/SQLite tables:
    Creates AuditRun, populates AuditFinding entities, and updates Website scores if linked.
    """
    readiness_data = report.get("readiness", {})
    engagement_data = report.get("engagement", {})

    audit_run = db.query(AuditRun).filter(AuditRun.id == job_id).first()
    if not audit_run:
        audit_run = AuditRun(
            id=job_id,
            website_id=website_id,
            target_url=target_url,
            status="completed",
            current_stage="orchestrator",
            stages=report.get("specialist_status", {}),
            created_at=datetime.now(timezone.utc),
        )
        db.add(audit_run)

    audit_run.status = "completed"
    audit_run.completed_at = datetime.now(timezone.utc)
    audit_run.readiness_score = float(readiness_data.get("score", 0))
    audit_run.readiness_label = str(readiness_data.get("label", ""))
    audit_run.engagement_score = float(engagement_data.get("score", 0))
    audit_run.engagement_label = str(engagement_data.get("label", ""))
    audit_run.engagement_dimensions = engagement_data.get("dimensions", {})
    audit_run.summary = report.get("summary", {})
    audit_run.severity_summary = report.get("severity_summary", {})
    audit_run.category_summary = report.get("category_summary", {})
    audit_run.priority_actions = report.get("priority_actions", [])
    audit_run.recommendations = report.get("recommendations", [])
    audit_run.specialist_status = report.get("specialist_status", {})
    audit_run.full_report_json = report

    # Clear existing findings if updating
    db.query(AuditFinding).filter(AuditFinding.audit_run_id == job_id).delete()

    raw_findings = report.get("findings", [])
    for f in raw_findings:
        f_code = f.get("id", "F-000")
        f_cat = f.get("category", "General")
        f_title = f.get("title", "")
        f_src = f.get("source_url", target_url)
        fingerprint = generate_finding_fingerprint(f_cat, f_title, f_src)

        finding_obj = AuditFinding(
            audit_run_id=job_id,
            finding_code=f_code,
            fingerprint=fingerprint,
            category=f_cat,
            title=f_title,
            severity=f.get("severity", "medium").lower(),
            confidence=float(f.get("confidence", 1.0)),
            evidence=str(f.get("evidence", "")),
            impact=str(f.get("impact", "")),
            suggested_action=f.get("suggested_action", {}),
            source_url=f_src,
            status="open",
        )
        db.add(finding_obj)

    # If linked to a website, update website's latest scores and last_audit_at
    if website_id:
        website = db.query(Website).filter(Website.id == website_id).first()
        if website:
            website.last_audit_at = audit_run.completed_at
            website.latest_readiness_score = audit_run.readiness_score
            website.latest_engagement_score = audit_run.engagement_score
            
            # Recalculate health score: harmonic blend of readiness and engagement
            if audit_run.readiness_score is not None and audit_run.engagement_score is not None:
                website.latest_health_score = round(
                    (audit_run.readiness_score * 0.6) + (audit_run.engagement_score * 0.4), 1
                )

    db.commit()
    db.refresh(audit_run)
    return audit_run


@router.get("/website/{website_id}/history")
def get_website_audit_history(
    website_id: str,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    """
    Returns timeline of historical audits for a registered website.
    """
    runs = (
        db.query(AuditRun)
        .filter(AuditRun.website_id == website_id, AuditRun.status == "completed")
        .order_by(AuditRun.completed_at.desc())
        .limit(limit)
        .all()
    )
    history = []
    for r in runs:
        history.append({
            "id": r.id,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "readiness_score": r.readiness_score,
            "readiness_label": r.readiness_label,
            "engagement_score": r.engagement_score,
            "engagement_label": r.engagement_label,
            "total_findings": r.summary.get("total_findings", 0) if r.summary else 0,
            "severity_summary": r.severity_summary,
        })
    return history


@router.get("/compare/{audit_id_a}/{audit_id_b}", response_model=AuditComparisonDiff)
def compare_audit_runs(
    audit_id_a: str,
    audit_id_b: str,
    db: Session = Depends(get_db),
):
    """
    Performs deterministic before-and-after diff between two audit runs.
    Audit A is treated as previous; Audit B is treated as latest.
    """
    run_a = db.query(AuditRun).filter(AuditRun.id == audit_id_a).first()
    run_b = db.query(AuditRun).filter(AuditRun.id == audit_id_b).first()

    if not run_a or not run_b:
        raise HTTPException(status_code=404, detail="One or both audit runs could not be found.")

    findings_a = db.query(AuditFinding).filter(AuditFinding.audit_run_id == audit_id_a).all()
    findings_b = db.query(AuditFinding).filter(AuditFinding.audit_run_id == audit_id_b).all()

    map_a = {f.fingerprint: f for f in findings_a}
    map_b = {f.fingerprint: f for f in findings_b}

    resolved = []
    for fp, f in map_a.items():
        if fp not in map_b:
            resolved.append({
                "fingerprint": fp,
                "finding_code": f.finding_code,
                "title": f.title,
                "category": f.category,
                "severity": f.severity,
            })

    new_findings = []
    for fp, f in map_b.items():
        if fp not in map_a:
            new_findings.append({
                "fingerprint": fp,
                "finding_code": f.finding_code,
                "title": f.title,
                "category": f.category,
                "severity": f.severity,
            })

    persistent = []
    for fp, f in map_b.items():
        if fp in map_a:
            persistent.append({
                "fingerprint": fp,
                "finding_code": f.finding_code,
                "title": f.title,
                "category": f.category,
                "severity": f.severity,
                "previous_severity": map_a[fp].severity,
            })

    score_a = run_a.readiness_score or 0.0
    score_b = run_b.readiness_score or 0.0
    delta = round(score_b - score_a, 1)

    return AuditComparisonDiff(
        previous_audit_id=audit_id_a,
        latest_audit_id=audit_id_b,
        previous_score=score_a,
        latest_score=score_b,
        score_delta=delta,
        resolved_findings=resolved,
        new_findings=new_findings,
        persistent_findings=persistent,
    )


@router.get("/competitors/compare")
def compare_competitors(
    urls: str = Query(..., description="Comma-separated list of 2 to 4 competitor URLs"),
    db: Session = Depends(get_db),
):
    """
    Public website audit comparison across competitors.
    Uses identical audit criteria and strictly isolates public audits from private analytics.
    """
    target_urls = [u.strip() for u in urls.split(",") if u.strip()][:4]
    if len(target_urls) < 2:
        raise HTTPException(status_code=400, detail="Please provide at least 2 competitor URLs to compare.")

    comparison_results = []
    for u in target_urls:
        run = (
            db.query(AuditRun)
            .filter(AuditRun.target_url.like(f"%{u}%"), AuditRun.status == "completed")
            .order_by(AuditRun.completed_at.desc())
            .first()
        )
        if run:
            comparison_results.append({
                "url": u,
                "audit_id": run.id,
                "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                "readiness_score": run.readiness_score,
                "engagement_score": run.engagement_score,
                "readiness_label": run.readiness_label,
                "total_findings": run.summary.get("total_findings", 0) if run.summary else 0,
                "severity_summary": run.severity_summary,
                "category_summary": run.category_summary,
            })
        else:
            comparison_results.append({
                "url": u,
                "audit_id": None,
                "status": "not_yet_audited",
                "message": "No public audit on record for this competitor. Run an audit to compare.",
            })

    return {
        "competitors": comparison_results,
        "is_public_audit": True,
        "note": "Competitor scores reflect independently audited public website data. Private analytics are never exposed.",
    }
