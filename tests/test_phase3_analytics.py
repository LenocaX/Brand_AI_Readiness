import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timezone

from backend.database import Base
from backend.models_db import User, Website, AnalyticsEvent, VisitorSession
from backend.schemas import AnalyticsEventIngest
from backend.routers.analytics import ingest_analytics_event, get_analytics_overview

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


def test_analytics_empty_state_zero_fabrication(test_db):
    user = User(email="owner@test.com", hashed_password="pw")
    test_db.add(user)
    test_db.commit()

    website = Website(user_id=user.id, name="Clean Site", domain="clean.com", canonical_url="https://clean.com")
    test_db.add(website)
    test_db.commit()

    overview = get_analytics_overview(website_id=website.id, db=test_db)
    # Must report 0, not fabricated figures!
    assert overview.total_visitors == 0
    assert overview.pageviews == 0
    assert overview.sessions == 0
    assert overview.bounce_rate_pct == 0.0


def test_analytics_session_and_event_lifecycle(test_db):
    user = User(email="owner2@test.com", hashed_password="pw")
    test_db.add(user)
    test_db.commit()

    website = Website(user_id=user.id, name="Live Site", domain="livesite.com", canonical_url="https://livesite.com")
    test_db.add(website)
    test_db.commit()

    # Ingest first pageview
    session_id = "session_abc_123"
    ev1 = AnalyticsEvent(
        website_id=website.id,
        session_id=session_id,
        event_type="pageview",
        page_url="https://livesite.com/",
        country="US",
        device_category="desktop",
        traffic_source="organic_search",
        created_at=datetime.now(timezone.utc),
    )
    sess1 = VisitorSession(
        id=session_id,
        website_id=website.id,
        country="US",
        device_category="desktop",
        traffic_source="organic_search",
        entry_page="https://livesite.com/",
        exit_page="https://livesite.com/",
        total_pageviews=1,
        duration_seconds=0,
        is_bounce=True,
        is_engaged=False,
        started_at=datetime.now(timezone.utc),
        last_activity_at=datetime.now(timezone.utc),
    )
    test_db.add_all([ev1, sess1])
    test_db.commit()

    # Check overview: 1 visitor, 1 session, 100% bounce
    overview1 = get_analytics_overview(website_id=website.id, db=test_db)
    assert overview1.total_visitors == 1
    assert overview1.pageviews == 1
    assert overview1.bounce_rate_pct == 100.0

    # Ingest second pageview in same session -> no longer bounce!
    sess1.total_pageviews = 2
    sess1.is_bounce = False
    sess1.is_engaged = True
    sess1.duration_seconds = 45
    test_db.commit()

    overview2 = get_analytics_overview(website_id=website.id, db=test_db)
    assert overview2.total_visitors == 1
    assert overview2.pageviews == 2
    assert overview2.bounce_rate_pct == 0.0
    assert overview2.engagement_rate_pct == 100.0
