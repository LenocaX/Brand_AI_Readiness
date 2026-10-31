from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import List, Optional

from backend.database import get_db
from backend.models_db import Website, User, AuditRun
from backend.schemas import (
    WebsiteCreateRequest,
    WebsiteResponse,
    WebsiteVerifyResponse,
    RepeatUrlCheckResponse,
)
from backend.auth import get_current_user, get_optional_current_user
from backend.verification import verify_domain_ownership
from core.url_utils import validate_url, is_safe_public_url

router = APIRouter(prefix="/api/websites", tags=["Websites"])


def normalize_domain(url_str: str) -> tuple[str, str]:
    """
    Normalizes a URL to a standard canonical base URL and root domain.
    E.g. 'https://www.example.com/path/' -> ('example.com', 'https://example.com')
    """
    if not url_str.startswith("http://") and not url_str.startswith("https://"):
        url_str = f"https://{url_str}"
        
    parsed = urlparse(url_str)
    netloc = parsed.netloc.lower()
    # Strip port if standard
    if ":" in netloc:
        host, port = netloc.split(":", 1)
        if (parsed.scheme == "https" and port == "443") or (parsed.scheme == "http" and port == "80"):
            netloc = host

    # Strip 'www.' for normalized identity comparison
    domain_clean = netloc[4:] if netloc.startswith("www.") else netloc
    canonical_url = f"{parsed.scheme}://{netloc}"
    return domain_clean, canonical_url


@router.post("", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
def register_website(
    request: WebsiteCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not is_safe_public_url(request.url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or restricted website URL.",
        )

    domain_clean, canonical_url = normalize_domain(request.url)
    site_name = request.name or domain_clean

    # Check if user has already registered this website
    existing = (
        db.query(Website)
        .filter(Website.user_id == current_user.id, Website.domain == domain_clean)
        .first()
    )
    if existing:
        return existing

    website = Website(
        user_id=current_user.id,
        name=site_name,
        domain=domain_clean,
        canonical_url=canonical_url,
        category=request.category or "General",
    )
    db.add(website)
    db.commit()
    db.refresh(website)
    return website


@router.get("", response_model=List[WebsiteResponse])
def list_user_websites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Website)
        .filter(Website.user_id == current_user.id)
        .order_by(Website.created_at.desc())
        .all()
    )


@router.get("/repeat-check", response_model=RepeatUrlCheckResponse)
def check_repeat_url(
    url: str = Query(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Repeat URL Recognition workflow:
    1. Normalizes the entered URL.
    2. Checks if website is registered (under current user or in registry).
    3. Fetches latest completed audit record, scores, and timestamp.
    4. Allows viewing existing report or running fresh audit.
    """
    if not is_safe_public_url(url):
        return RepeatUrlCheckResponse(is_registered=False)

    domain_clean, canonical = normalize_domain(url)
    
    # Check if registered by current user or globally in registry
    query = db.query(Website).filter(Website.domain == domain_clean)
    if current_user:
        user_site = query.filter(Website.user_id == current_user.id).first()
        site = user_site or query.first()
    else:
        site = query.first()

    if not site:
        # Check if there are any historical public audit runs for this target URL
        last_audit = (
            db.query(AuditRun)
            .filter(AuditRun.target_url.like(f"%{domain_clean}%"), AuditRun.status == "completed")
            .order_by(AuditRun.completed_at.desc())
            .first()
        )
        if last_audit:
            return RepeatUrlCheckResponse(
                is_registered=False,
                last_audit={
                    "id": last_audit.id,
                    "target_url": last_audit.target_url,
                    "completed_at": last_audit.completed_at.isoformat() if last_audit.completed_at else None,
                    "readiness_score": last_audit.readiness_score,
                    "engagement_score": last_audit.engagement_score,
                },
            )
        return RepeatUrlCheckResponse(is_registered=False)

    # Site is registered; fetch latest completed audit
    last_audit = (
        db.query(AuditRun)
        .filter(AuditRun.website_id == site.id, AuditRun.status == "completed")
        .order_by(AuditRun.completed_at.desc())
        .first()
    )

    audit_dict = None
    if last_audit:
        audit_dict = {
            "id": last_audit.id,
            "target_url": last_audit.target_url,
            "completed_at": last_audit.completed_at.isoformat() if last_audit.completed_at else None,
            "readiness_score": last_audit.readiness_score,
            "readiness_label": last_audit.readiness_label,
            "engagement_score": last_audit.engagement_score,
            "summary": last_audit.summary,
        }

    return RepeatUrlCheckResponse(
        is_registered=True,
        website=site,
        last_audit=audit_dict,
        previous_scores={
            "readiness": site.latest_readiness_score,
            "performance": site.latest_performance_score,
            "engagement": site.latest_engagement_score,
            "health": site.latest_health_score,
        },
    )


@router.get("/{website_id}", response_model=WebsiteResponse)
def get_website_details(
    website_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    website = (
        db.query(Website)
        .filter(Website.id == website_id, Website.user_id == current_user.id)
        .first()
    )
    if not website:
        raise HTTPException(status_code=404, detail="Website not found or unauthorized.")
    return website


@router.delete("/{website_id}")
def delete_website(
    website_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    website = (
        db.query(Website)
        .filter(Website.id == website_id, Website.user_id == current_user.id)
        .first()
    )
    if not website:
        raise HTTPException(status_code=404, detail="Website not found or unauthorized.")
    db.delete(website)
    db.commit()
    return {"message": "Website deleted successfully.", "website_id": website_id}


@router.post("/{website_id}/verify", response_model=WebsiteVerifyResponse)
def verify_website_ownership(
    website_id: str,
    sandbox: bool = Query(False, description="Allow instant sandbox verification for testing and demonstration"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    website = (
        db.query(Website)
        .filter(Website.id == website_id, Website.user_id == current_user.id)
        .first()
    )
    if not website:
        raise HTTPException(status_code=404, detail="Website not found or unauthorized.")

    if website.is_verified:
        return WebsiteVerifyResponse(
            website_id=website.id,
            domain=website.domain,
            is_verified=True,
            verification_method="Already verified",
            message="Domain ownership was previously verified.",
        )

    verified, method = verify_domain_ownership(website.canonical_url, website.verification_token)
    
    # If DNS/HTTP check fails, allow sandbox verification if requested or for demo domains
    if not verified and (sandbox or website.domain in ("localhost", "127.0.0.1") or "github.com" in website.domain or "youtube.com" in website.domain):
        verified = True
        method = "Automated Demo Sandbox Verification"

    if verified:
        website.is_verified = True
        website.verified_at = datetime.now(timezone.utc)
        db.commit()
        return WebsiteVerifyResponse(
            website_id=website.id,
            domain=website.domain,
            is_verified=True,
            verification_method=method,
            message="Ownership successfully verified. Visitor analytics are now unlocked.",
        )
    else:
        return WebsiteVerifyResponse(
            website_id=website.id,
            domain=website.domain,
            is_verified=False,
            verification_method="None",
            message=f"Could not verify domain '{website.domain}'. Please ensure '{website.verification_token}' is present at '{website.canonical_url}/.well-known/canopy-verification.txt' or in a DNS TXT record.",
        )
