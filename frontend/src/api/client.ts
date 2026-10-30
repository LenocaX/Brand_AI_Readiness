import { AuditReport, AuditJob } from '../types/audit';
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

/**
 * Fetch the authentic sample report from the backend.
 * Falls back gracefully to the bundled sample if backend is unreachable.
 */
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

/**
 * Creates an asynchronous audit job in the backend.
 * Returns the AuditJob descriptor with authentic initial stages.
 */
export async function createAuditJob(targetUrl: string): Promise<AuditJob> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: targetUrl }),
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

/**
 * Polls the current authentic status of an ongoing or completed audit job.
 */
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

/**
 * Cancels an in-progress audit job.
 */
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

/**
 * Legacy synchronous audit runner.
 */
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
      // Use fallback error message
    }
    const sanitized = detail.length > 200 ? `${detail.slice(0, 200)}...` : detail;
    throw new AuditApiError(`Audit failed: ${sanitized}`, response.status);
  }

  const report = await response.json();
  return report as AuditReport;
}

/**
 * Quick health check to verify backend reachability.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
