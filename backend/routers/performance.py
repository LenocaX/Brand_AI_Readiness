from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from backend.database import get_db
from backend.models_db import Website, PerformanceMetric, ImageMetric, User
from backend.performance import run_synthetic_or_live_perf_analysis
from backend.auth import get_optional_current_user
from core.url_utils import is_safe_public_url

router = APIRouter(prefix="/api", tags=["Performance Intelligence"])


@router.get("/performance/standalone")
def run_standalone_performance(
    url: str = Query(...),
    device: str = Query(default="desktop"),
):
    """
    Runs a laboratory Core Web Vitals and image analysis on any public website URL.
    """
    clean_url = url.strip()
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = f"https://{clean_url}"

    return run_synthetic_or_live_perf_analysis(clean_url, device=device)


@router.post("/websites/{website_id}/performance/run")
def trigger_website_performance_audit(
    website_id: str,
    device: str = Query(default="desktop"),
    db: Session = Depends(get_db),
):
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        # Check by domain or create transient entry for audited domain
        clean_domain = website_id.replace("site-", "").replace("_", ".")
        website = db.query(Website).filter(Website.domain == clean_domain).first()
        if not website:
            canonical = f"https://{clean_domain}"
            website = Website(
                id=website_id,
                name=clean_domain,
                domain=clean_domain,
                canonical_url=canonical,
                category="General",
            )
            db.add(website)
            db.commit()
            db.refresh(website)

    result = run_synthetic_or_live_perf_analysis(website.canonical_url, device=device)

    metrics = result.get("metrics", {})
    perf_metric = PerformanceMetric(
        website_id=website.id,
        url=website.canonical_url,
        device=device,
        lcp=metrics.get("lcp"),
        inp=metrics.get("inp"),
        cls=metrics.get("cls"),
        fcp=metrics.get("fcp"),
        ttfb=metrics.get("ttfb"),
        performance_score=float(result.get("performance_score", 0)),
        total_page_weight_bytes=result.get("page_weight_bytes"),
        total_requests=result.get("total_requests"),
    )
    db.add(perf_metric)
    db.flush()

    # Save images
    raw_images = result.get("images", [])
    for img in raw_images:
        img_record = ImageMetric(
            performance_metric_id=perf_metric.id,
            website_id=website.id,
            page_url=img["page_url"],
            image_url=img["image_url"],
            format=img["format"],
            file_size_bytes=img["file_size_bytes"],
            natural_width=img["natural_width"],
            natural_height=img["natural_height"],
            displayed_width=img["displayed_width"],
            displayed_height=img["displayed_height"],
            download_duration_ms=img["download_duration_ms"],
            is_lazy_loaded=img["is_lazy_loaded"],
            has_explicit_dimensions=img["has_explicit_dimensions"],
            is_oversized=img["is_oversized"],
            potential_savings_bytes=img["potential_savings_bytes"],
            is_lcp_candidate=img["is_lcp_candidate"],
        )
        db.add(img_record)

    # Update website score
    website.latest_performance_score = perf_metric.performance_score
    if website.latest_readiness_score and website.latest_engagement_score:
        website.latest_health_score = round(
            (website.latest_readiness_score * 0.4) +
            (website.latest_performance_score * 0.3) +
            (website.latest_engagement_score * 0.3), 1
        )

    db.commit()
    db.refresh(perf_metric)

    return result


@router.get("/websites/{website_id}/performance")
def get_website_performance(
    website_id: str,
    device: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        clean_domain = website_id.replace("site-", "").replace("_", ".")
        website = db.query(Website).filter(Website.domain == clean_domain).first()
        if not website:
            canonical = f"https://{clean_domain}"
            return run_synthetic_or_live_perf_analysis(canonical, device=device or "desktop")

    query = db.query(PerformanceMetric).filter(PerformanceMetric.website_id == website_id)
    if device:
        query = query.filter(PerformanceMetric.device == device)

    latest = query.order_by(PerformanceMetric.created_at.desc()).first()
    if not latest:
        # Run an initial measurement on the fly
        return trigger_website_performance_audit(website_id=website_id, device=device or "desktop", db=db)

    # Fetch associated images
    images = (
        db.query(ImageMetric)
        .filter(ImageMetric.performance_metric_id == latest.id)
        .order_by(ImageMetric.file_size_bytes.desc())
        .all()
    )

    images_summary = {
        "total_images": len(images),
        "oversized_images": sum(1 for img in images if img.is_oversized),
        "total_image_bytes": sum(img.file_size_bytes for img in images),
        "potential_savings_bytes": sum(img.potential_savings_bytes for img in images),
    }

    return {
        "url": latest.url,
        "device": latest.device,
        "performance_score": latest.performance_score,
        "metrics": {
            "lcp": latest.lcp,
            "inp": latest.inp,
            "cls": latest.cls,
            "fcp": latest.fcp,
            "ttfb": latest.ttfb,
        },
        "thresholds": {
            "lcp_status": "good" if (latest.lcp or 0) <= 2.5 else ("needs_improvement" if (latest.lcp or 0) <= 4.0 else "poor"),
            "inp_status": "good" if (latest.inp or 0) <= 200 else ("needs_improvement" if (latest.inp or 0) <= 500 else "poor"),
            "cls_status": "good" if (latest.cls or 0) <= 0.1 else ("needs_improvement" if (latest.cls or 0) <= 0.25 else "poor"),
            "fcp_status": "good" if (latest.fcp or 0) <= 1.8 else ("needs_improvement" if (latest.fcp or 0) <= 3.0 else "poor"),
            "ttfb_status": "good" if (latest.ttfb or 0) <= 0.8 else ("needs_improvement" if (latest.ttfb or 0) <= 1.8 else "poor"),
        },
        "page_weight_bytes": latest.total_page_weight_bytes,
        "total_requests": latest.total_requests,
        "created_at": latest.created_at.isoformat(),
        "images_summary": images_summary,
        "images": images,
    }


@router.get("/websites/{website_id}/images")
def get_website_images(
    website_id: str,
    oversized_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    query = db.query(ImageMetric).filter(ImageMetric.website_id == website_id)
    if oversized_only:
        query = query.filter(ImageMetric.is_oversized == True)

    images = query.order_by(ImageMetric.file_size_bytes.desc()).all()
    return images
