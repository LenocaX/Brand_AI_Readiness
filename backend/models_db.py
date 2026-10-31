import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    websites = relationship("Website", back_populates="user", cascade="all, delete-orphan")


class Website(Base):
    __tablename__ = "websites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False, index=True)
    canonical_url = Column(String(1024), nullable=False)
    category = Column(String(100), default="General", nullable=False)
    
    # Ownership verification
    verification_token = Column(String(64), nullable=False, default=generate_uuid)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Monitoring configuration
    monitoring_enabled = Column(Boolean, default=False, nullable=False)
    monitoring_frequency = Column(String(50), default="daily", nullable=False)  # daily, weekly, monthly
    
    # Latest aggregated scores
    last_audit_at = Column(DateTime(timezone=True), nullable=True)
    latest_readiness_score = Column(Float, nullable=True)
    latest_performance_score = Column(Float, nullable=True)
    latest_engagement_score = Column(Float, nullable=True)
    latest_health_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="websites")
    audit_runs = relationship("AuditRun", back_populates="website", cascade="all, delete-orphan")
    performance_metrics = relationship("PerformanceMetric", back_populates="website", cascade="all, delete-orphan")
    image_metrics = relationship("ImageMetric", back_populates="website", cascade="all, delete-orphan")
    analytics_events = relationship("AnalyticsEvent", back_populates="website", cascade="all, delete-orphan")
    visitor_sessions = relationship("VisitorSession", back_populates="website", cascade="all, delete-orphan")
    monitoring_schedules = relationship("MonitoringSchedule", back_populates="website", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="website", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_website_user_domain", "user_id", "domain"),
    )


class AuditRun(Base):
    __tablename__ = "audit_runs"

    id = Column(String(64), primary_key=True)  # Supports "job-..." or UUID
    website_id = Column(String(36), ForeignKey("websites.id", ondelete="CASCADE"), nullable=True, index=True)
    target_url = Column(String(1024), nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, in_progress, completed, failed, cancelled
    current_stage = Column(String(50), default="crawl", nullable=False)
    stages = Column(JSON, nullable=False, default=dict)
    
    # Scores
    readiness_score = Column(Float, nullable=True)
    readiness_label = Column(String(50), nullable=True)
    engagement_score = Column(Float, nullable=True)
    engagement_label = Column(String(50), nullable=True)
    engagement_dimensions = Column(JSON, nullable=True)
    
    # Summaries
    summary = Column(JSON, nullable=True)
    severity_summary = Column(JSON, nullable=True)
    category_summary = Column(JSON, nullable=True)
    priority_actions = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    specialist_status = Column(JSON, nullable=True)
    
    # Full original JSON payload for complete backwards-compatibility & export
    full_report_json = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    website = relationship("Website", back_populates="audit_runs")
    findings = relationship("AuditFinding", back_populates="audit_run", cascade="all, delete-orphan")
    performance_metric = relationship("PerformanceMetric", back_populates="audit_run", uselist=False)

    __table_args__ = (
        Index("idx_audit_run_website_created", "website_id", "created_at"),
    )


class AuditFinding(Base):
    __tablename__ = "audit_findings"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    audit_run_id = Column(String(64), ForeignKey("audit_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    finding_code = Column(String(50), nullable=False)  # e.g. "CE-002", "EA-001"
    fingerprint = Column(String(64), nullable=False, index=True)  # Normalized hash for comparison diffing
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False)  # critical, high, medium, low, info
    confidence = Column(Float, default=1.0, nullable=False)
    evidence = Column(Text, nullable=False)
    impact = Column(Text, nullable=False)
    suggested_action = Column(JSON, nullable=True)
    source_url = Column(String(1024), nullable=False)
    status = Column(String(50), default="open", nullable=False)  # open, resolved, regressed
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    audit_run = relationship("AuditRun", back_populates="findings")


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    website_id = Column(String(36), ForeignKey("websites.id", ondelete="CASCADE"), nullable=True, index=True)
    audit_run_id = Column(String(64), ForeignKey("audit_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    url = Column(String(1024), nullable=False)
    device = Column(String(50), default="desktop", nullable=False)  # desktop, mobile
    
    # Core Web Vitals (Lab)
    lcp = Column(Float, nullable=True)  # seconds
    inp = Column(Float, nullable=True)  # milliseconds
    cls = Column(Float, nullable=True)  # score
    fcp = Column(Float, nullable=True)  # seconds
    ttfb = Column(Float, nullable=True)  # seconds
    performance_score = Column(Float, nullable=True)  # 0 - 100
    
    total_page_weight_bytes = Column(Integer, nullable=True)
    total_requests = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    website = relationship("Website", back_populates="performance_metrics")
    audit_run = relationship("AuditRun", back_populates="performance_metric")
    images = relationship("ImageMetric", back_populates="performance_metric", cascade="all, delete-orphan")


class ImageMetric(Base):
    __tablename__ = "image_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    performance_metric_id = Column(String(36), ForeignKey("performance_metrics.id", ondelete="CASCADE"), nullable=True, index=True)
    website_id = Column(String(36), ForeignKey("websites.id", ondelete="CASCADE"), nullable=True, index=True)
    page_url = Column(String(1024), nullable=False)
    image_url = Column(String(2048), nullable=False)
    format = Column(String(50), nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    natural_width = Column(Integer, nullable=True)
    natural_height = Column(Integer, nullable=True)
    displayed_width = Column(Integer, nullable=True)
    displayed_height = Column(Integer, nullable=True)
    download_duration_ms = Column(Float, nullable=True)
    is_lazy_loaded = Column(Boolean, default=False, nullable=False)
    has_explicit_dimensions = Column(Boolean, default=False, nullable=False)
    is_oversized = Column(Boolean, default=False, nullable=False)
    potential_savings_bytes = Column(Integer, default=0, nullable=False)
    is_lcp_candidate = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    performance_metric = relationship("PerformanceMetric", back_populates="images")
    website = relationship("Website", back_populates="image_metrics")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    website_id = Column(String(36), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)  # pageview, session_start, scroll, click_cta, outbound, conversion
    page_url = Column(String(1024), nullable=False)
    page_title = Column(String(255), nullable=True)
    referrer = Column(String(1024), nullable=True)
    
    # Derived privacy-conscious metadata (no raw IP stored)
    country = Column(String(10), default="Unknown", nullable=False)
    device_category = Column(String(50), default="desktop", nullable=False)
    browser = Column(String(50), nullable=True)
    os = Column(String(50), nullable=True)
    traffic_source = Column(String(50), default="direct", nullable=False)  # direct, organic_search, social, referral, campaign
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    
    scroll_depth_pct = Column(Integer, nullable=True)
    event_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    website = relationship("Website", back_populates="analytics_events")

    __table_args__ = (
        Index("idx_analytics_site_created", "website_id", "created_at"),
        Index("idx_analytics_site_type", "website_id", "event_type"),
    )


class VisitorSession(Base):
    __tablename__ = "visitor_sessions"

    id = Column(String(64), primary_key=True)  # session_id
    website_id = Column(String(36), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    country = Column(String(10), default="Unknown", nullable=False)
    device_category = Column(String(50), default="desktop", nullable=False)
    browser = Column(String(50), nullable=True)
    os = Column(String(50), nullable=True)
    traffic_source = Column(String(50), default="direct", nullable=False)
    entry_page = Column(String(1024), nullable=False)
    exit_page = Column(String(1024), nullable=True)
    total_pageviews = Column(Integer, default=1, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    is_bounce = Column(Boolean, default=True, nullable=False)
    is_engaged = Column(Boolean, default=False, nullable=False)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    last_activity_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    website = relationship("Website", back_populates="visitor_sessions")

    __table_args__ = (
        Index("idx_session_site_activity", "website_id", "last_activity_at"),
    )


class MonitoringSchedule(Base):
    __tablename__ = "monitoring_schedules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    website_id = Column(String(36), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    frequency = Column(String(50), default="daily", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    notify_email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    website = relationship("Website", back_populates="monitoring_schedules")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    website_id = Column(String(36), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)  # regression, crawler_block, performance_degraded, broken_link
    severity = Column(String(50), default="medium", nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    website = relationship("Website", back_populates="alerts")
