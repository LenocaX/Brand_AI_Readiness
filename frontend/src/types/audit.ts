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

export type ActiveView =
  | 'landing'
  | 'in_progress'
  | 'overview'
  | 'findings'
  | 'finding_detail'
  | 'recommendations'
  | 'settings';
