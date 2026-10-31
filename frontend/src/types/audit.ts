export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ReadinessLabel = 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor' | 'Unknown';

export type SpecialistSkillId =
  | 'crawl'
  | 'structured_data'
  | 'content_extractability'
  | 'freshness'
  | 'engagement';

export type SpecialistStatus = 'completed' | 'in_progress' | 'pending' | 'waiting' | 'failed';

export type StageStatus = 'pending' | 'active' | 'completed' | 'failed';

export interface AuditJobStages {
  crawl: StageStatus;
  structured_data: StageStatus;
  content_extractability: StageStatus;
  freshness: StageStatus;
  engagement: StageStatus;
  orchestrator: StageStatus;
}

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface AuditJob {
  job_id: string;
  url: string;
  status: JobStatus;
  current_stage: keyof AuditJobStages;
  stages: AuditJobStages;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  report: AuditReport | null;
}

export interface SuggestedAction {
  summary: string;
  priority?: string;
}

export interface Finding {
  id: string;
  category: string;
  title: string;
  severity: SeverityLevel;
  confidence: number;
  evidence: string;
  impact: string;
  suggested_action: SuggestedAction;
  source_url: string;
  status?: string;
  evidence_type?: string;
}

export interface Recommendation {
  priority: SeverityLevel | string;
  finding_id: string;
  title: string;
  action: string;
  source_url: string;
}

export interface PriorityAction {
  finding_id: string;
  action: string;
  priority: string;
}

export interface EngagementDimensions {
  clarity: number;
  navigation: number;
  orientation: number;
  content_accessibility: number;
  cta_clarity: number;
  context_retention: number;
  [key: string]: number;
}

export interface AuditReport {
  site: string;
  audited_at: string;
  specialist_status: Record<SpecialistSkillId | string, SpecialistStatus>;
  readiness: {
    score: number;
    label: ReadinessLabel | string;
  };
  engagement: {
    score: number;
    label: string;
    dimensions: EngagementDimensions;
  };
  summary: {
    total_findings: number;
    pages_checked: number;
    crawl_errors: number;
  };
  severity_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  category_summary: Record<string, number>;
  priority_actions: PriorityAction[];
  recommendations: Recommendation[];
  findings: Finding[];
}

// --------------------------------------------------------------------
// SAAS PLATFORM EXTENSIONS
// --------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
}

export interface Website {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  canonical_url: string;
  category: string;
  verification_token: string;
  is_verified: boolean;
  verified_at: string | null;
  monitoring_enabled: boolean;
  monitoring_frequency: string;
  last_audit_at: string | null;
  latest_readiness_score: number | null;
  latest_performance_score: number | null;
  latest_engagement_score: number | null;
  latest_health_score: number | null;
  created_at: string;
}

export interface AICrawlerItem {
  name: string;
  owner: string;
  purpose: string;
  status: 'allowed' | 'disallowed' | 'unspecified';
  evidence: string;
}

export interface AICrawlersInspectResponse {
  has_robots_txt: boolean;
  robots_url: string;
  total_crawlers_evaluated: number;
  disallowed_count: number;
  crawlers: AICrawlerItem[];
  raw_robots_preview: string;
}

export interface ImageItem {
  id?: string;
  image_url: string;
  page_url: string;
  format: string;
  file_size_bytes: number;
  natural_width?: number;
  natural_height?: number;
  displayed_width?: number;
  displayed_height?: number;
  download_duration_ms?: number;
  is_lazy_loaded: boolean;
  has_explicit_dimensions: boolean;
  is_oversized: boolean;
  potential_savings_bytes: number;
  is_lcp_candidate: boolean;
  is_cdn?: boolean;
}

export interface PerformanceData {
  url: string;
  device: 'desktop' | 'mobile';
  performance_score: number;
  metrics: {
    lcp: number;
    inp: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  thresholds: {
    lcp_status: 'good' | 'needs_improvement' | 'poor';
    inp_status: 'good' | 'needs_improvement' | 'poor';
    cls_status: 'good' | 'needs_improvement' | 'poor';
    fcp_status: 'good' | 'needs_improvement' | 'poor';
    ttfb_status: 'good' | 'needs_improvement' | 'poor';
  };
  page_weight_bytes: number;
  total_requests: number;
  images_summary: {
    total_images: number;
    oversized_images: number;
    total_image_bytes: number;
    potential_savings_bytes: number;
  };
  images: ImageItem[];
  recommendations: Array<{
    title: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    opportunity: string;
    action: string;
  }>;
}

export interface AnalyticsOverview {
  total_visitors: number;
  unique_visitors: number;
  pageviews: number;
  sessions: number;
  avg_duration_seconds: number;
  bounce_rate_pct: number;
  engagement_rate_pct: number;
  conversion_count: number;
  conversion_rate_pct: number;
  live_visitors: number;
}

export interface CountryTraffic {
  country: string;
  visitors: number;
  pageviews: number;
  percentage: number;
}

export interface TrafficSourceItem {
  source: string;
  visitors: number;
  percentage: number;
}

export interface TopPageItem {
  page_url: string;
  pageviews: number;
  avg_engagement_seconds: number;
  exit_rate_pct: number;
}

export interface LiveTrafficData {
  live_visitors: number;
  active_pages: string[];
  recent_events: Array<{
    event_type: string;
    page_url: string;
    country: string;
    created_at: string;
  }>;
}

export interface AuditHistoryItem {
  id: string;
  completed_at: string;
  readiness_score: number;
  readiness_label: string;
  engagement_score: number;
  engagement_label: string;
  total_findings: number;
  severity_summary: Record<string, number>;
}

export interface ComparisonDiff {
  previous_audit_id: string;
  latest_audit_id: string;
  previous_score: number;
  latest_score: number;
  score_delta: number;
  resolved_findings: Array<{
    fingerprint: string;
    finding_code: string;
    title: string;
    category: string;
    severity: string;
  }>;
  new_findings: Array<{
    fingerprint: string;
    finding_code: string;
    title: string;
    category: string;
    severity: string;
  }>;
  persistent_findings: Array<{
    fingerprint: string;
    finding_code: string;
    title: string;
    category: string;
    severity: string;
    previous_severity?: string;
  }>;
}

export interface AlertItem {
  id: string;
  website_id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  evidence?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface MonitoringConfig {
  website_id: string;
  is_active: boolean;
  frequency: string;
  last_run_at: string | null;
  next_run_at: string | null;
  notify_email?: string | null;
}

export type ActiveView =
  | 'landing'
  | 'in_progress'
  | 'overview'
  | 'ai_readiness'
  | 'performance'
  | 'analytics'
  | 'history_comparison'
  | 'findings'
  | 'finding_detail'
  | 'recommendations'
  | 'settings';
