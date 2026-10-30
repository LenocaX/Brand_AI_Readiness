import React, { useEffect, useState, useRef } from 'react';
import { AuditJob, AuditReport, StageStatus } from '../types/audit';
import { getJobStatus, cancelAuditJob, AuditApiError } from '../api/client';
import { PageHeading } from '../design-system/PageHeading';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

export interface AuditInProgressViewProps {
  jobId: string;
  initialJob?: AuditJob;
  targetUrl: string;
  onAuditComplete: (report: AuditReport) => void;
  onRetry: () => void;
  onReturnToDashboard: () => void;
}

interface StageDefinition {
  key: keyof AuditJob['stages'];
  stepNumber: number;
  title: string;
  description: string;
}

const SPECIALIST_STAGES: StageDefinition[] = [
  {
    key: 'crawl',
    stepNumber: 1,
    title: 'Crawl & Render',
    description: 'Evaluates HTTP availability, title and meta tags, and compares raw HTML with browser-rendered DOM.',
  },
  {
    key: 'structured_data',
    stepNumber: 2,
    title: 'Structured Data',
    description: 'Validates Schema.org JSON-LD entities and machine-readable metadata structures.',
  },
  {
    key: 'content_extractability',
    stepNumber: 3,
    title: 'Content Extractability',
    description: 'Analyzes explicit text density, heading content depth, and image alt text discoverability.',
  },
  {
    key: 'freshness',
    stepNumber: 4,
    title: 'Freshness & Proof',
    description: 'Checks date signals, copyright currency, and corroboration for key claims.',
  },
  {
    key: 'engagement',
    stepNumber: 5,
    title: 'Engagement',
    description: 'Audits primary navigation, heading hierarchy, calls to action, and dead-end pages.',
  },
  {
    key: 'orchestrator',
    stepNumber: 6,
    title: 'Audit Orchestrator',
    description: 'Merges duplicate findings, computes final readiness and engagement scores, and validates the report schema.',
  },
];

export const AuditInProgressView: React.FC<AuditInProgressViewProps> = ({
  jobId,
  initialJob,
  targetUrl,
  onAuditComplete,
  onRetry,
  onReturnToDashboard,
}) => {
  const [job, setJob] = useState<AuditJob | null>(initialJob || null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Polling ref to ensure strict cleanup on unmount
  const pollTimerRef = useRef<number | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    const poll = async () => {
      try {
        const updatedJob = await getJobStatus(jobId);
        if (!isMountedRef.current) return;

        setJob(updatedJob);
        setNetworkError(null);
        consecutiveErrorsRef.current = 0;

        // Check terminal states
        if (updatedJob.status === 'completed') {
          if (updatedJob.report) {
            // Briefly pause so user sees all stages marked complete, then transition
            setTimeout(() => {
              if (isMountedRef.current && updatedJob.report) {
                onAuditComplete(updatedJob.report);
              }
            }, 600);
          }
          return; // Stop polling on completion
        }

        if (updatedJob.status === 'failed' || updatedJob.status === 'cancelled') {
          return; // Stop polling on failure
        }

        // Schedule next poll interval (1500ms)
        pollTimerRef.current = window.setTimeout(poll, 1500);
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        consecutiveErrorsRef.current += 1;

        if (err instanceof AuditApiError && err.status === 404) {
          setNetworkError(`Audit job '${jobId}' was not found on the server.`);
          return; // Stop polling if job is invalid
        }

        // If multiple consecutive network failures occur
        if (consecutiveErrorsRef.current >= 3) {
          setNetworkError('Connection to audit engine lost. The server might be unreachable or timed out.');
        } else {
          // Retry poll after 2500ms
          pollTimerRef.current = window.setTimeout(poll, 2500);
        }
      }
    };

    // Begin polling immediately
    poll();

    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [jobId, onAuditComplete]);

  const handleCancel = async () => {
    setIsCancelling(true);
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    try {
      await cancelAuditJob(jobId);
      if (isMountedRef.current) {
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: 'cancelled',
                error: 'Audit was cancelled by user.',
              }
            : null
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false);
      }
    }
  };

  // Genuine stage calculation from real backend data
  const stages = job?.stages || {
    crawl: 'pending',
    structured_data: 'pending',
    content_extractability: 'pending',
    freshness: 'pending',
    engagement: 'pending',
    orchestrator: 'pending',
  };

  const completedStagesCount = Object.values(stages).filter((s) => s === 'completed').length;
  const isFailed = job?.status === 'failed' || job?.status === 'cancelled' || !!networkError;
  const isCompleted = job?.status === 'completed';
  const isInProgress = !isFailed && !isCompleted;

  // Genuine progress percentage based exclusively on verified completed stages
  const progressPercent = Math.round((completedStagesCount / SPECIALIST_STAGES.length) * 100);
  const displayUrl = job?.url || targetUrl;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <PageHeading
        eyebrow="AUDIT IN PROGRESS"
        title={`Auditing ${displayUrl}`}
        subtitle={
          isFailed
            ? 'The audit could not be completed.'
            : isCompleted
            ? 'Audit completed. Finalizing report overview...'
            : 'Running 5 specialist skills and generating evidence...'
        }
        action={
          isInProgress ? (
            <Badge variant="forest" showDot>
              In progress
            </Badge>
          ) : isCompleted ? (
            <Badge variant="success" showDot>
              Completed
            </Badge>
          ) : (
            <Badge variant="critical" showDot>
              Failed
            </Badge>
          )
        }
      />

      {/* Overall Authentic Progress Bar */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-4) var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--color-charcoal)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span>OVERALL PROGRESS</span>
          <span className="font-mono" style={{ color: 'var(--color-charcoal-muted)' }}>
            {completedStagesCount} of {SPECIALIST_STAGES.length} stages completed ({progressPercent}%)
          </span>
        </div>

        <div className="meter-track" style={{ height: '6px' }}>
          <div
            className={`meter-fill ${isFailed ? 'meter-fill-critical' : 'meter-fill-success'}`}
            style={{
              width: `${progressPercent}%`,
              transition: 'width 0.4s ease-out',
            }}
          />
        </div>
      </div>

      {/* Failure Banner when applicable */}
      {isFailed && (
        <div
          style={{
            backgroundColor: 'var(--color-critical-bg)',
            border: '1px solid var(--color-critical-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4) var(--space-5)',
            marginBottom: 'var(--space-6)',
          }}
          role="alert"
        >
          <div style={{ fontWeight: 600, color: 'var(--color-critical)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
            Audit Execution Failed
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal)', lineHeight: 'var(--leading-relaxed)' }}>
            {job?.error || networkError || 'An error occurred while running the specialist audit skills.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="primary" size="sm" onClick={onRetry}>
              Try Again
            </Button>
            <Button variant="secondary" size="sm" onClick={onReturnToDashboard}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Specialist Skills & Orchestrator Stage Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {SPECIALIST_STAGES.map((stage) => {
          const stageStatus: StageStatus = stages[stage.key] || 'pending';
          const isStageCompleted = stageStatus === 'completed';
          const isStageActive = stageStatus === 'active';
          const isStageFailed = stageStatus === 'failed';

          let statusBadgeVariant: 'success' | 'forest' | 'critical' | 'neutral' = 'neutral';
          let statusText = 'Pending';

          if (isStageCompleted) {
            statusBadgeVariant = 'success';
            statusText = 'Completed';
          } else if (isStageActive) {
            statusBadgeVariant = 'forest';
            statusText = 'In progress';
          } else if (isStageFailed) {
            statusBadgeVariant = 'critical';
            statusText = 'Failed';
          }

          return (
            <div
              key={stage.key}
              className="progress-card"
              style={{
                borderColor: isStageActive
                  ? 'var(--color-forest)'
                  : isStageFailed
                  ? 'var(--color-critical-border)'
                  : 'var(--color-border)',
                backgroundColor: isStageActive
                  ? 'var(--color-ivory-light)'
                  : 'var(--color-surface-white)',
              }}
            >
              <div className="progress-left">
                <div
                  className={`progress-number ${isStageCompleted ? 'completed' : ''}`}
                  style={
                    isStageFailed
                      ? {
                          backgroundColor: 'var(--color-critical-bg)',
                          borderColor: 'var(--color-critical)',
                          color: 'var(--color-critical)',
                        }
                      : undefined
                  }
                >
                  {isStageCompleted ? '✓' : stage.stepNumber}
                </div>

                <div className="progress-content">
                  <div
                    className="progress-title"
                    style={{
                      color: isStageFailed ? 'var(--color-critical)' : 'var(--color-charcoal)',
                    }}
                  >
                    {stage.title}
                  </div>
                  <div className="progress-desc">{stage.description}</div>
                </div>
              </div>

              <div className="progress-right">
                <Badge variant={statusBadgeVariant} showDot>
                  {statusText}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Controls: Cancel / Status Note */}
      {isInProgress && (
        <div
          style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-4) var(--space-5)',
            backgroundColor: 'var(--color-surface-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>
            Job ID: <span className="font-mono">{jobId}</span> · Polling engine every 1.5s
          </div>
          <Button
            variant="outline-forest"
            size="sm"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Audit'}
          </Button>
        </div>
      )}
    </div>
  );
};
