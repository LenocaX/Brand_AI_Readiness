from pydantic import BaseModel, EmailStr, HttpUrl, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


# ----------------------------------------------------
# AUTH SCHEMAS
# ----------------------------------------------------
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime


# ----------------------------------------------------
# WEBSITE SCHEMAS
# ----------------------------------------------------
class WebsiteCreateRequest(BaseModel):
    url: str
    name: Optional[str] = None
    category: Optional[str] = "General"


class WebsiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    domain: str
    canonical_url: str
    category: str
    verification_token: str
    is_verified: bool
    verified_at: Optional[datetime] = None
    monitoring_enabled: bool
    monitoring_frequency: str
    last_audit_at: Optional[datetime] = None
    latest_readiness_score: Optional[float] = None
    latest_performance_score: Optional[float] = None
    latest_engagement_score: Optional[float] = None
    latest_health_score: Optional[float] = None
    created_at: datetime


class WebsiteVerifyResponse(BaseModel):
    website_id: str
    domain: str
    is_verified: bool
    verification_method: str
    message: str


# ----------------------------------------------------
# AUDIT & COMPARISON SCHEMAS
# ----------------------------------------------------
class RepeatUrlCheckResponse(BaseModel):
    is_registered: bool
    website: Optional[WebsiteResponse] = None
    last_audit: Optional[Dict[str, Any]] = None
    previous_scores: Optional[Dict[str, Any]] = None


class AuditFindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    finding_code: str
    fingerprint: str
    category: str
    title: str
    severity: str
    confidence: float
    evidence: str
    impact: str
    suggested_action: Optional[Dict[str, Any]] = None
    source_url: str
    status: str
    created_at: datetime


class AuditComparisonDiff(BaseModel):
    previous_audit_id: str
    latest_audit_id: str
    previous_score: float
    latest_score: float
    score_delta: float
    resolved_findings: List[Dict[str, Any]]
    new_findings: List[Dict[str, Any]]
    persistent_findings: List[Dict[str, Any]]
    performance_diff: Optional[Dict[str, Any]] = None


# ----------------------------------------------------
# PERFORMANCE & IMAGE SCHEMAS
# ----------------------------------------------------
class ImageMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    page_url: str
    image_url: str
    format: str
    file_size_bytes: int
    natural_width: Optional[int] = None
    natural_height: Optional[int] = None
    displayed_width: Optional[int] = None
    displayed_height: Optional[int] = None
    download_duration_ms: Optional[float] = None
    is_lazy_loaded: bool
    has_explicit_dimensions: bool
    is_oversized: bool
    potential_savings_bytes: int
    is_lcp_candidate: bool


class PerformanceMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    device: str
    lcp: Optional[float] = None
    inp: Optional[float] = None
    cls: Optional[float] = None
    fcp: Optional[float] = None
    ttfb: Optional[float] = None
    performance_score: Optional[float] = None
    total_page_weight_bytes: Optional[int] = None
    total_requests: Optional[int] = None
    created_at: datetime
    images: List[ImageMetricResponse] = []


# ----------------------------------------------------
# ANALYTICS & VISITOR SCHEMAS
# ----------------------------------------------------
class AnalyticsEventIngest(BaseModel):
    website_id: str
    session_id: str
    event_type: str  # pageview, session_start, scroll, click_cta, outbound, conversion
    page_url: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    device_category: Optional[str] = "desktop"
    browser: Optional[str] = None
    os: Optional[str] = None
    traffic_source: Optional[str] = "direct"
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    scroll_depth_pct: Optional[int] = None
    event_data: Optional[Dict[str, Any]] = None


class AnalyticsOverviewResponse(BaseModel):
    total_visitors: int
    unique_visitors: int
    pageviews: int
    sessions: int
    avg_duration_seconds: float
    bounce_rate_pct: float
    engagement_rate_pct: float
    conversion_count: int
    conversion_rate_pct: float
    live_visitors: int


class CountryTraffic(BaseModel):
    country: str
    visitors: int
    pageviews: int
    percentage: float


class TrafficSourceItem(BaseModel):
    source: str
    visitors: int
    percentage: float


class TopPageItem(BaseModel):
    page_url: str
    pageviews: int
    avg_engagement_seconds: float
    exit_rate_pct: float


# ----------------------------------------------------
# MONITORING & ALERTS SCHEMAS
# ----------------------------------------------------
class MonitoringScheduleRequest(BaseModel):
    frequency: str  # daily, weekly, monthly
    is_active: bool = True
    notify_email: Optional[str] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    website_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    evidence: Optional[str] = None
    is_read: bool
    created_at: datetime
