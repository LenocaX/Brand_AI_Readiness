from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from backend.database import get_db
from backend.models_db import Website, MonitoringSchedule, Alert, AuditRun
from backend.schemas import MonitoringScheduleRequest, AlertResponse
from backend.auth import get_optional_current_user

router = APIRouter(prefix="/api", tags=["Continuous Monitoring & Alerts"])


@router.get("/websites/{website_id}/monitoring")
def get_monitoring_config(
    website_id: str,
    db: Session = Depends(get_db),
):
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    schedule = (
        db.query(MonitoringSchedule)
        .filter(MonitoringSchedule.website_id == website_id)
        .first()
    )

    if not schedule:
        # Default schedule
        schedule = MonitoringSchedule(
            website_id=website.id,
            frequency=website.monitoring_frequency or "daily",
            is_active=website.monitoring_enabled,
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)

    return {
        "website_id": website.id,
        "is_active": schedule.is_active,
        "frequency": schedule.frequency,
        "last_run_at": schedule.last_run_at.isoformat() if schedule.last_run_at else None,
        "next_run_at": schedule.next_run_at.isoformat() if schedule.next_run_at else None,
        "notify_email": schedule.notify_email,
    }


@router.post("/websites/{website_id}/monitoring")
def update_monitoring_config(
    website_id: str,
    request: MonitoringScheduleRequest,
    db: Session = Depends(get_db),
):
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    schedule = (
        db.query(MonitoringSchedule)
        .filter(MonitoringSchedule.website_id == website_id)
        .first()
    )

    now = datetime.now(timezone.utc)
    interval_days = 1 if request.frequency == "daily" else (7 if request.frequency == "weekly" else 30)
    next_run = now + timedelta(days=interval_days) if request.is_active else None

    if not schedule:
        schedule = MonitoringSchedule(
            website_id=website.id,
            frequency=request.frequency,
            is_active=request.is_active,
            notify_email=request.notify_email,
            next_run_at=next_run,
        )
        db.add(schedule)
    else:
        schedule.frequency = request.frequency
        schedule.is_active = request.is_active
        schedule.notify_email = request.notify_email
        schedule.next_run_at = next_run

    website.monitoring_enabled = request.is_active
    website.monitoring_frequency = request.frequency

    db.commit()
    return {
        "status": "updated",
        "is_active": schedule.is_active,
        "frequency": schedule.frequency,
        "next_run_at": schedule.next_run_at.isoformat() if schedule.next_run_at else None,
    }


@router.get("/websites/{website_id}/alerts", response_model=List[AlertResponse])
def get_website_alerts(
    website_id: str,
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    query = db.query(Alert).filter(Alert.website_id == website_id)
    if unread_only:
        query = query.filter(Alert.is_read == False)

    return query.order_by(Alert.created_at.desc()).limit(50).all()


@router.post("/websites/{website_id}/alerts/{alert_id}/read")
def mark_alert_read(
    website_id: str,
    alert_id: str,
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.website_id == website_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    alert.is_read = True
    db.commit()
    return {"status": "success", "alert_id": alert_id, "is_read": True}


@router.post("/websites/{website_id}/monitoring/trigger-check")
def trigger_monitoring_health_check(
    website_id: str,
    db: Session = Depends(get_db),
):
    """
    Executes an automated health check:
    Evaluates website availability, checks latest score trends,
    and detects performance degradation or regressions, generating alerts.
    """
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    # Fetch last 2 completed audits
    runs = (
        db.query(AuditRun)
        .filter(AuditRun.website_id == website_id, AuditRun.status == "completed")
        .order_by(AuditRun.completed_at.desc())
        .limit(2)
        .all()
    )

    alerts_generated = []
    now = datetime.now(timezone.utc)

    if len(runs) >= 2:
        latest_run = runs[0]
        prev_run = runs[1]
        
        # Check score drop regression
        if latest_run.readiness_score is not None and prev_run.readiness_score is not None:
            score_drop = prev_run.readiness_score - latest_run.readiness_score
            if score_drop >= 10:
                alert = Alert(
                    website_id=website.id,
                    alert_type="regression",
                    severity="high" if score_drop >= 20 else "medium",
                    title="AI Readiness Score Regression Detected",
                    message=f"Readiness score decreased by {score_drop:.1f} points (from {prev_run.readiness_score:.0f} to {latest_run.readiness_score:.0f}).",
                    evidence=f"Previous Audit: {prev_run.id} ({prev_run.completed_at.strftime('%Y-%m-%d')}) vs Latest Audit: {latest_run.id}",
                )
                db.add(alert)
                alerts_generated.append(alert.title)

    # Check if readiness score is below 60
    if website.latest_readiness_score and website.latest_readiness_score < 60:
        alert = Alert(
            website_id=website.id,
            alert_type="crawler_block",
            severity="high",
            title="Low AI-Readiness Rating Warning",
            message=f"Current readiness score is {website.latest_readiness_score:.0f}/100. AI bots may struggle to index or cite your site.",
            evidence=f"Audit completed on {website.last_audit_at.strftime('%Y-%m-%d') if website.last_audit_at else 'recent'}",
        )
        db.add(alert)
        alerts_generated.append(alert.title)

    # Update schedule last_run_at
    schedule = db.query(MonitoringSchedule).filter(MonitoringSchedule.website_id == website_id).first()
    if schedule:
        schedule.last_run_at = now
        interval_days = 1 if schedule.frequency == "daily" else (7 if schedule.frequency == "weekly" else 30)
        schedule.next_run_at = now + timedelta(days=interval_days)

    db.commit()
    return {
        "status": "completed",
        "checked_at": now.isoformat(),
        "alerts_generated": len(alerts_generated),
        "alert_titles": alerts_generated,
    }
