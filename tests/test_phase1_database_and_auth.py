import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timezone

from backend.database import Base
from backend.models_db import User, Website, AuditRun, AuditFinding
from backend.auth import hash_password, verify_password, create_access_token
from backend.routers.websites import normalize_domain
from backend.routers.audits import generate_finding_fingerprint, persist_audit_report_to_db

@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_password_hashing_and_verification():
    raw_pass = "SuperSecretCanopyPassword123"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_user_creation_and_jwt(test_db):
    user = User(
        email="founder@example.com",
        hashed_password=hash_password("securepassword"),
        full_name="Jane Doe",
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    assert user.id is not None
    assert user.email == "founder@example.com"
    assert user.is_active is True

    token = create_access_token({"sub": user.id, "email": user.email})
    assert isinstance(token, str)
    assert len(token) > 20


def test_url_normalization():
    domain1, canon1 = normalize_domain("https://www.example.com/path?query=1")
    domain2, canon2 = normalize_domain("http://example.com")
    domain3, canon3 = normalize_domain("example.com/")

    assert domain1 == "example.com"
    assert domain2 == "example.com"
    assert domain3 == "example.com"
    assert canon1 == "https://www.example.com"


def test_website_registration_and_cascade(test_db):
    user = User(
        email="webmaster@test.com",
        hashed_password=hash_password("pw123"),
    )
    test_db.add(user)
    test_db.commit()

    website = Website(
        user_id=user.id,
        name="Acme Corp",
        domain="acme.com",
        canonical_url="https://acme.com",
    )
    test_db.add(website)
    test_db.commit()
    test_db.refresh(website)

    assert website.id is not None
    assert website.verification_token is not None
    assert website.is_verified is False

    # Verify relationship
    assert len(user.websites) == 1
    assert user.websites[0].domain == "acme.com"


def test_audit_run_persistence_and_findings(test_db):
    user = User(email="analyst@test.com", hashed_password=hash_password("pw123"))
    test_db.add(user)
    test_db.commit()

    website = Website(user_id=user.id, name="TestSite", domain="testsite.com", canonical_url="https://testsite.com")
    test_db.add(website)
    test_db.commit()

    sample_report = {
        "site": "testsite.com",
        "readiness": {"score": 85, "label": "Good"},
        "engagement": {"score": 90, "label": "Excellent", "dimensions": {"clarity": 90}},
        "summary": {"total_findings": 2, "pages_checked": 1},
        "severity_summary": {"critical": 0, "high": 1, "medium": 1, "low": 0, "info": 0},
        "category_summary": {"metadata": 1, "content": 1},
        "specialist_status": {"crawl": "completed", "structured_data": "completed"},
        "findings": [
            {
                "id": "CR-001",
                "category": "metadata",
                "title": "Missing meta description",
                "severity": "high",
                "confidence": 1.0,
                "evidence": "No meta description found",
                "impact": "Search engines generate synthetic snippets",
                "source_url": "https://testsite.com",
            },
            {
                "id": "CE-002",
                "category": "content",
                "title": "Low text density",
                "severity": "medium",
                "confidence": 0.9,
                "evidence": "Only 45 words detected",
                "impact": "AI crawlers may struggle to extract brand value",
                "source_url": "https://testsite.com",
            },
        ],
    }

    job_id = "job-unit-test-1"
    audit_run = persist_audit_report_to_db(
        db=test_db,
        job_id=job_id,
        target_url="https://testsite.com",
        report=sample_report,
        website_id=website.id,
    )

    assert audit_run.id == job_id
    assert audit_run.readiness_score == 85.0
    assert audit_run.engagement_score == 90.0
    
    findings = test_db.query(AuditFinding).filter(AuditFinding.audit_run_id == job_id).all()
    assert len(findings) == 2
    assert findings[0].fingerprint is not None

    # Check updated website score
    test_db.refresh(website)
    assert website.latest_readiness_score == 85.0
    assert website.latest_engagement_score == 90.0
    assert website.latest_health_score == 87.0
