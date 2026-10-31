import {
  AuditReport,
  AuditJob,
  User,
  Website,
  PerformanceData,
  ImageItem,
  AnalyticsOverview,
  CountryTraffic,
  TrafficSourceItem,
  TopPageItem,
  LiveTrafficData,
  AuditHistoryItem,
  ComparisonDiff,
  AlertItem,
  MonitoringConfig,
  AICrawlersInspectResponse,
} from '../types/audit';
import { sampleReport } from '../mock/sampleReport';

const API_BASE = '/api';

export class AuditApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuditApiError';
    this.status = status;
  }
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
export async function registerUser(email: string, password: string, fullName?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new AuditApiError(err.detail || 'Registration failed', res.status);
  }
  return res.json();
}

export async function loginUser(email: string, password: string): Promise<{ user: User; access_token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
    throw new AuditApiError(err.detail || 'Invalid email or password', res.status);
  }
  return res.json();
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// WEBSITES API & REPEAT URL RECOGNITION
// ----------------------------------------------------
export async function getWebsites(): Promise<Website[]> {
  const res = await fetch(`${API_BASE}/websites`);
  if (!res.ok) return [];
  return res.json();
}

export async function createWebsite(url: string, name?: string, category?: string): Promise<Website> {
  const res = await fetch(`${API_BASE}/websites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to register website' }));
    throw new AuditApiError(err.detail || 'Failed to register website', res.status);
  }
  return res.json();
}

export async function deleteWebsite(websiteId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}`, { method: 'DELETE' });
  if (!res.ok) throw new AuditApiError('Failed to delete website', res.status);
}

export async function verifyWebsite(websiteId: string, sandbox: boolean = true): Promise<{ is_verified: boolean; message: string; verification_method: string }> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/verify?sandbox=${sandbox}`, { method: 'POST' });
  if (!res.ok) throw new AuditApiError('Verification failed', res.status);
  return res.json();
}

export async function checkRepeatUrl(url: string): Promise<{
  is_registered: boolean;
  website?: Website | null;
  last_audit?: { id: string; target_url: string; completed_at?: string; readiness_score?: number; readiness_label?: string; engagement_score?: number } | null;
  previous_scores?: Record<string, number | null>;
}> {
  const res = await fetch(`${API_BASE}/websites/repeat-check?url=${encodeURIComponent(url)}`);
  if (!res.ok) return { is_registered: false };
  return res.json();
}

// ----------------------------------------------------
// AUDITS, HISTORY & COMPARISONS
// ----------------------------------------------------
export async function getWebsiteAuditHistory(websiteId: string): Promise<AuditHistoryItem[]> {
  const res = await fetch(`${API_BASE}/audits/website/${encodeURIComponent(websiteId)}/history`);
  if (!res.ok) return [];
  return res.json();
}

export async function compareAuditRuns(auditIdA: string, auditIdB: string): Promise<ComparisonDiff> {
  const res = await fetch(`${API_BASE}/audits/compare/${encodeURIComponent(auditIdA)}/${encodeURIComponent(auditIdB)}`);
  if (!res.ok) throw new AuditApiError('Failed to compare audit runs', res.status);
  return res.json();
}

export async function compareCompetitors(urls: string[]): Promise<any> {
  const param = encodeURIComponent(urls.join(','));
  const res = await fetch(`${API_BASE}/audits/competitors/compare?urls=${param}`);
  if (!res.ok) throw new AuditApiError('Competitor comparison failed', res.status);
  return res.json();
}

export async function inspectAICrawlers(url: string): Promise<AICrawlersInspectResponse> {
  const res = await fetch(`${API_BASE}/audits/crawlers/inspect?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new AuditApiError('Failed to inspect AI crawlers', res.status);
  return res.json();
}

// ----------------------------------------------------
// PERFORMANCE & IMAGE LAB API
// ----------------------------------------------------
export async function getWebsitePerformance(websiteId: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<PerformanceData> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/performance?device=${device}`);
  if (!res.ok) throw new AuditApiError('Failed to load performance metrics', res.status);
  return res.json();
}

export async function runWebsitePerformance(websiteId: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<PerformanceData> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/performance/run?device=${device}`, {
    method: 'POST',
  });
  if (!res.ok) throw new AuditApiError('Failed to execute performance test', res.status);
  return res.json();
}

export async function getStandalonePerformance(url: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<PerformanceData> {
  const res = await fetch(`${API_BASE}/performance/standalone?url=${encodeURIComponent(url)}&device=${device}`);
  if (!res.ok) throw new AuditApiError('Performance check failed', res.status);
  return res.json();
}

export async function getWebsiteImages(websiteId: string, oversizedOnly: boolean = false): Promise<ImageItem[]> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/images?oversized_only=${oversizedOnly}`);
  if (!res.ok) return [];
  return res.json();
}

// ----------------------------------------------------
// VISITOR ANALYTICS API
// ----------------------------------------------------
export async function getAnalyticsOverview(websiteId: string, days: number = 30): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/analytics/overview?days=${days}`);
  if (!res.ok) throw new AuditApiError('Failed to load analytics overview', res.status);
  return res.json();
}

export async function getAnalyticsGeography(websiteId: string, days: number = 30): Promise<CountryTraffic[]> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/analytics/geography?days=${days}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getAnalyticsSources(websiteId: string, days: number = 30): Promise<TrafficSourceItem[]> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/analytics/sources?days=${days}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getAnalyticsPages(websiteId: string, days: number = 30): Promise<TopPageItem[]> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/analytics/pages?days=${days}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getLiveVisitors(websiteId: string): Promise<LiveTrafficData> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/analytics/live`);
  if (!res.ok) return { live_visitors: 0, active_pages: [], recent_events: [] };
  return res.json();
}

export async function sendTestAnalyticsEvent(websiteId: string): Promise<{ status: string; message: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/analytics/test-event`, {
    method: 'POST',
  });
  if (!res.ok) throw new AuditApiError('Failed to send test event', res.status);
  return res.json();
}

// ----------------------------------------------------
// CONTINUOUS MONITORING & ALERTS
// ----------------------------------------------------
export async function getMonitoringConfig(websiteId: string): Promise<MonitoringConfig> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/monitoring`);
  if (!res.ok) throw new AuditApiError('Failed to load monitoring config', res.status);
  return res.json();
}

export async function updateMonitoringConfig(websiteId: string, config: { frequency: string; is_active: boolean; notify_email?: string }): Promise<any> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/monitoring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new AuditApiError('Failed to update monitoring config', res.status);
  return res.json();
}

export async function getWebsiteAlerts(websiteId: string, unreadOnly: boolean = false): Promise<AlertItem[]> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/alerts?unread_only=${unreadOnly}`);
  if (!res.ok) return [];
  return res.json();
}

export async function markAlertRead(websiteId: string, alertId: string): Promise<void> {
  await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/alerts/${encodeURIComponent(alertId)}/read`, {
    method: 'POST',
  });
}

export async function triggerHealthCheck(websiteId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/websites/${encodeURIComponent(websiteId)}/monitoring/trigger-check`, {
    method: 'POST',
  });
  if (!res.ok) throw new AuditApiError('Health check failed', res.status);
  return res.json();
}

// ----------------------------------------------------
// EXISTING AUDIT RUNNER & SAMPLE API (BACKWARDS COMPATIBLE)
// ----------------------------------------------------
export async function getSampleReport(): Promise<AuditReport> {
  try {
    const res = await fetch(`${API_BASE}/sample-report`);
    if (!res.ok) {
      throw new AuditApiError(`Failed to load sample report: ${res.statusText}`, res.status);
    }
    const data = await res.json();
    return data as AuditReport;
  } catch (err) {
    console.warn('Backend sample-report endpoint unavailable, falling back to bundled sample:', err);
    return sampleReport;
  }
}

export async function createAuditJob(targetUrl: string, websiteId?: string): Promise<AuditJob> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: targetUrl, website_id: websiteId }),
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AuditApiError('The audit request was cancelled.');
    }
    throw new AuditApiError(
      'Unable to connect to the audit service. Please ensure the backend is running on port 8000.'
    );
  }

  if (!response.ok) {
    let detail = 'Failed to create audit job.';
    try {
      const errData = await response.json();
      if (errData.detail) {
        detail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // Use fallback error message
    }
    const sanitized = detail.length > 200 ? `${detail.slice(0, 200)}...` : detail;
    throw new AuditApiError(sanitized, response.status);
  }

  const job = await response.json();
  return job as AuditJob;
}

export async function getJobStatus(jobId: string, signal?: AbortSignal): Promise<AuditJob> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/jobs/${encodeURIComponent(jobId)}`, {
      method: 'GET',
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AuditApiError('Status check aborted.');
    }
    throw new AuditApiError('Network connection lost while polling audit status.');
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new AuditApiError(`Audit job '${jobId}' was not found.`, 404);
    }
    throw new AuditApiError(`Failed to fetch audit status (HTTP ${response.status}).`, response.status);
  }

  const job = await response.json();
  return job as AuditJob;
}

export async function cancelAuditJob(jobId: string): Promise<{ status: string; job_id: string }> {
  try {
    const response = await fetch(`${API_BASE}/jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new AuditApiError(`Failed to cancel job ${jobId}`, response.status);
    }
    return await response.json();
  } catch (err) {
    console.warn(`Cancel job ${jobId} failed:`, err);
    return { status: 'cancelled', job_id: jobId };
  }
}

export async function startAudit(targetUrl: string, signal?: AbortSignal): Promise<AuditReport> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/audits?sync=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: targetUrl, sync: true }),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AuditApiError('The audit request was cancelled.');
    }
    throw new AuditApiError(
      'Unable to connect to the audit service. Please ensure the backend is running on port 8000.'
    );
  }

  if (!response.ok) {
    let detail = 'Audit failed to complete.';
    try {
      const errData = await response.json();
      if (errData.detail) {
        detail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // Use fallback
    }
    const sanitized = detail.length > 200 ? `${detail.slice(0, 200)}...` : detail;
    throw new AuditApiError(`Audit failed: ${sanitized}`, response.status);
  }

  const report = await response.json();
  return report as AuditReport;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
