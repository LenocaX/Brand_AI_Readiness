import React from 'react';
import { AuditReport, SeverityLevel } from '../types/audit';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { ScoreCard, DimensionMeter } from '../design-system/ScoreDisplay';
import { PageHeading } from '../design-system/PageHeading';
import { DownloadIcon, ExternalLink, ArrowRight } from '../design-system/Indicators';
import { AICrawlersSection } from '../components/AICrawlersSection';

export interface ReportOverviewViewProps {
  report: AuditReport;
  isSampleReport?: boolean;
  onNavigateToFindings: (severityFilter?: string) => void;
  onNavigateToFindingDetail: (findingId: string) => void;
  onNavigateToRecommendations: () => void;
  onDownloadReport: () => void;
  onNewAudit: () => void;
}

export const ReportOverviewView: React.FC<ReportOverviewViewProps> = ({
  report,
  isSampleReport = false,
  onNavigateToFindings,
  onNavigateToFindingDetail,
  onNavigateToRecommendations,
  onDownloadReport,
  onNewAudit,
}) => {
  // Safe extraction with graceful fallbacks
  const site = report?.site || 'Unknown Target';
  const auditedAt = report?.audited_at ? new Date(report.audited_at) : null;
  const formattedDate = auditedAt && !isNaN(auditedAt.getTime())
    ? auditedAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : 'Unknown Date';

  const readinessScore = typeof report?.readiness?.score === 'number' ? report.readiness.score : 0;
  const readinessLabel = report?.readiness?.label || 'Unknown';

  const engagementScore = typeof report?.engagement?.score === 'number' ? report.engagement.score : 0;
  const engagementLabel = report?.engagement?.label || 'Unknown';

  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const totalFindings = report?.summary?.total_findings ?? findings.length;
  const pagesChecked = report?.summary?.pages_checked ?? 0;
  const crawlErrors = report?.summary?.crawl_errors ?? 0;

  // Derive severity counts reliably
  const severityCounts = {
    critical: report?.severity_summary?.critical ?? findings.filter((f) => f.severity === 'critical').length,
    high: report?.severity_summary?.high ?? findings.filter((f) => f.severity === 'high').length,
    medium: report?.severity_summary?.medium ?? findings.filter((f) => f.severity === 'medium').length,
    low: report?.severity_summary?.low ?? findings.filter((f) => f.severity === 'low').length,
    info: report?.severity_summary?.info ?? findings.filter((f) => f.severity === 'info').length,
  };

  // Dimensions
  const dimensions = report?.engagement?.dimensions || null;
  const dimensionKeys = dimensions ? Object.keys(dimensions) : [];

  // Specialist statuses
  const specialistStatus = report?.specialist_status || {};
  const specialistItems = [
    { key: 'crawl', label: 'Crawl & Render', status: specialistStatus['crawl'] || specialistStatus['crawl_render'] || 'unknown' },
    { key: 'structured_data', label: 'Structured Data', status: specialistStatus['structured_data'] || 'unknown' },
    { key: 'content_extractability', label: 'Content Extractability', status: specialistStatus['content_extractability'] || 'unknown' },
    { key: 'freshness', label: 'Freshness & Proof', status: specialistStatus['freshness'] || 'unknown' },
    { key: 'engagement', label: 'Engagement', status: specialistStatus['engagement'] || 'unknown' },
  ];

  // Highest-priority actions preview
  const recommendations = Array.isArray(report?.recommendations) ? report.recommendations : [];
  const priorityActionItems = recommendations.slice(0, 4);

  // Distribution segments for CSS-based severity visualization
  const distributionTotal = Math.max(1, totalFindings);
  const criticalPct = (severityCounts.critical / distributionTotal) * 100;
  const highPct = (severityCounts.high / distributionTotal) * 100;
  const mediumPct = (severityCounts.medium / distributionTotal) * 100;
  const lowPct = (severityCounts.low / distributionTotal) * 100;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeading
        eyebrow={isSampleReport ? "SAMPLE AUDIT REPORT" : "AUDIT REPORT OVERVIEW"}
        title={site}
        subtitle={`Completed on ${formattedDate}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<DownloadIcon size={14} />}
              iconPosition="left"
              onClick={onDownloadReport}
            >
              Export JSON Report
            </Button>
            <Button
              variant="outline-forest"
              size="sm"
              onClick={onNewAudit}
            >
              New Audit
            </Button>
          </div>
        }
      />

      {/* Sample Reference Data Banner */}
      {isSampleReport && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="neutral">REFERENCE SAMPLE</Badge>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>
              Viewing bundled reference audit for demonstration. Live audits generate real-time findings from your target website.
            </span>
          </div>
          <Button variant="outline-forest" size="sm" onClick={onNewAudit}>
            Run Live Audit
          </Button>
        </div>
      )}

      {/* Primary Score Displays (AI Readiness vs Engagement) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <ScoreCard
            title="AI Readiness Score"
            score={readinessScore}
            label={readinessLabel}
            variant="readiness"
          />
          <div
            style={{
              padding: '0 var(--space-6) var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-charcoal-muted)',
              backgroundColor: 'var(--color-surface-white)',
              borderLeft: '1px solid var(--color-border)',
              borderRight: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              borderBottomLeftRadius: 'var(--radius-sm)',
              borderBottomRightRadius: 'var(--radius-sm)',
            }}
          >
            Measures machine readability, Schema.org entities, and crawler accessibility.
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <ScoreCard
            title="On-Site Engagement Score"
            score={engagementScore}
            label={engagementLabel}
            variant="engagement"
          />
          <div
            style={{
              padding: '0 var(--space-6) var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-charcoal-muted)',
              backgroundColor: 'var(--color-surface-white)',
              borderLeft: '1px solid var(--color-border)',
              borderRight: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              borderBottomLeftRadius: 'var(--radius-sm)',
              borderBottomRightRadius: 'var(--radius-sm)',
            }}
          >
            Measures visitor orientation, primary navigation clarity, and call-to-action discoverability.
          </div>
        </div>
      </div>

      {/* Severity Distribution & Quick Filter Navigation */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-charcoal-muted)' }}>
            Finding Severity Distribution
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>
            Click a severity tier to filter findings
          </span>
        </div>

        {/* Severity Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <button
            onClick={() => onNavigateToFindings('all')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-ivory)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', color: 'var(--color-charcoal-muted)', fontWeight: 600 }}>Total Findings</div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--color-charcoal)', marginTop: '2px' }}>
              {totalFindings}
            </div>
          </button>

          <button
            onClick={() => onNavigateToFindings('critical')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: severityCounts.critical > 0 ? 'var(--color-critical-bg)' : 'var(--color-surface-white)',
              border: '1px solid',
              borderColor: severityCounts.critical > 0 ? 'var(--color-critical-border)' : 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', color: 'var(--color-critical)', fontWeight: 600 }}>Critical</div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--color-critical)', marginTop: '2px' }}>
              {severityCounts.critical}
            </div>
          </button>

          <button
            onClick={() => onNavigateToFindings('high')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: severityCounts.high > 0 ? 'var(--color-high-bg)' : 'var(--color-surface-white)',
              border: '1px solid',
              borderColor: severityCounts.high > 0 ? 'var(--color-high-border)' : 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', color: 'var(--color-high)', fontWeight: 600 }}>High</div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--color-high)', marginTop: '2px' }}>
              {severityCounts.high}
            </div>
          </button>

          <button
            onClick={() => onNavigateToFindings('medium')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: severityCounts.medium > 0 ? 'var(--color-medium-bg)' : 'var(--color-surface-white)',
              border: '1px solid',
              borderColor: severityCounts.medium > 0 ? 'var(--color-medium-border)' : 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', color: 'var(--color-medium)', fontWeight: 600 }}>Medium</div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--color-medium)', marginTop: '2px' }}>
              {severityCounts.medium}
            </div>
          </button>

          <button
            onClick={() => onNavigateToFindings('low')}
            style={{
              padding: 'var(--space-3)',
              backgroundColor: severityCounts.low > 0 ? 'var(--color-low-bg)' : 'var(--color-surface-white)',
              border: '1px solid',
              borderColor: severityCounts.low > 0 ? 'var(--color-low-border)' : 'var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', color: 'var(--color-low)', fontWeight: 600 }}>Low</div>
            <div className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--color-low)', marginTop: '2px' }}>
              {severityCounts.low}
            </div>
          </button>
        </div>

        {/* Accessible CSS Stacked Bar */}
        {totalFindings > 0 ? (
          <div>
            <div
              style={{
                display: 'flex',
                height: '8px',
                width: '100%',
                borderRadius: 'var(--radius-none)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-ivory-dark)',
                border: '1px solid var(--color-border)',
              }}
              aria-label="Severity proportion meter"
            >
              {criticalPct > 0 && <div style={{ width: `${criticalPct}%`, backgroundColor: 'var(--color-critical)' }} title={`Critical: ${severityCounts.critical}`} />}
              {highPct > 0 && <div style={{ width: `${highPct}%`, backgroundColor: 'var(--color-high)' }} title={`High: ${severityCounts.high}`} />}
              {mediumPct > 0 && <div style={{ width: `${mediumPct}%`, backgroundColor: 'var(--color-medium)' }} title={`Medium: ${severityCounts.medium}`} />}
              {lowPct > 0 && <div style={{ width: `${lowPct}%`, backgroundColor: 'var(--color-low)' }} title={`Low: ${severityCounts.low}`} />}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
            No detected severity penalties. All audited checks passed.
          </div>
        )}
      </div>

      {/* AI Search & LLM Crawlers Inspection */}
      <AICrawlersSection url={site} />

      {/* Main 2-Column Grid: Left Analytics vs Right Metadata & Action Plan */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* Left Column: Engagement Dimensions + Specialist Statuses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Engagement Dimensions */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-6)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
                color: 'var(--color-charcoal-muted)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Engagement Breakdown Dimensions
            </h3>

            {dimensions && dimensionKeys.length > 0 ? (
              <div>
                {dimensionKeys.map((dimKey) => {
                  const label = dimKey
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <DimensionMeter
                      key={dimKey}
                      label={label}
                      score={dimensions[dimKey]}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', padding: 'var(--space-4) 0' }}>
                Engagement dimension breakdown metrics were not recorded for this target.
              </div>
            )}
          </div>

          {/* Specialist Audit Statuses */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-6)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
                color: 'var(--color-charcoal-muted)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Specialist Skill Statuses
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {specialistItems.map((spec) => {
                const isCompleted = spec.status === 'completed';
                const isFailed = spec.status === 'failed';
                const badgeVariant: 'success' | 'critical' | 'neutral' = isCompleted
                  ? 'success'
                  : isFailed
                  ? 'critical'
                  : 'neutral';

                return (
                  <div
                    key={spec.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-2) 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--color-charcoal)' }}>{spec.label}</span>
                    <Badge variant={badgeVariant} showDot>
                      {spec.status.charAt(0).toUpperCase() + spec.status.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Audit Metadata + Highest-Priority Action Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Audit Metadata */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-6)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wide)',
                color: 'var(--color-charcoal-muted)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Audit Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-charcoal-muted)' }}>Pages Inspected</span>
                <span style={{ fontWeight: 600 }}>{pagesChecked}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-charcoal-muted)' }}>Crawl Errors</span>
                <span style={{ fontWeight: 600 }}>{crawlErrors}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-charcoal-muted)' }}>Audited Target</span>
                <a
                  href={site.startsWith('http') ? site : `https://${site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--color-forest)',
                    textDecoration: 'underline',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span className="font-mono">{site}</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-charcoal-muted)' }}>Audit Time</span>
                <span className="font-mono" style={{ fontSize: 'var(--text-xs)' }}>
                  {formattedDate}
                </span>
              </div>

              {/* Target Site Preview Frame */}
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-surface-white)',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--color-ivory)',
                    borderBottom: '1px solid var(--color-border)',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'inline-block' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'inline-block' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'inline-block' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-charcoal-muted)', margin: '0 auto', fontFamily: 'var(--font-mono)' }}>
                    {site}
                  </div>
                </div>

                <div style={{ padding: 'var(--space-4)', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', fontSize: '10px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>
                      {site}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', color: 'var(--color-charcoal-muted)' }}>
                      <span>Status: {readinessScore >= 80 ? 'Optimized' : readinessScore >= 60 ? 'Moderate' : 'Needs Work'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-charcoal-muted)', marginBottom: 'var(--space-2)' }}>
                    Machine-readable target evaluation for {site}
                  </div>
                  <div style={{ display: 'inline-flex', gap: '6px', marginTop: 'var(--space-2)' }}>
                    <div style={{ padding: '3px 8px', fontSize: '10px', backgroundColor: 'var(--color-forest)', color: 'var(--color-ivory-light)', borderRadius: '2px', fontWeight: 500 }}>
                      {readinessLabel} ({readinessScore}/100)
                    </div>
                    <div style={{ padding: '3px 8px', fontSize: '10px', border: '1px solid var(--color-border)', color: 'var(--color-charcoal)', borderRadius: '2px' }}>
                      {report.summary?.pages_checked ?? 1} Pages Inspected
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Highest-Priority Action Plan Preview */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                  }}
                >
                  Priority Actions Preview
                </h3>
                {recommendations.length > 0 && (
                  <button
                    onClick={onNavigateToRecommendations}
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-forest)',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    View All ({recommendations.length})
                  </button>
                )}
              </div>

              {priorityActionItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {priorityActionItems.map((item, idx) => {
                    const priorityVariant: SeverityLevel =
                      item.priority === 'critical'
                        ? 'critical'
                        : item.priority === 'high'
                        ? 'high'
                        : item.priority === 'medium'
                        ? 'medium'
                        : 'low';

                    return (
                      <div
                        key={item.finding_id + idx}
                        style={{
                          padding: 'var(--space-3)',
                          backgroundColor: 'var(--color-ivory-light)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-forest)',
                              color: 'var(--color-ivory-light)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.action}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                          <Badge variant={priorityVariant}>
                            {item.priority.toUpperCase()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onNavigateToFindingDetail(item.finding_id)}
                          >
                            <span className="symbol-chevron-right" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', padding: 'var(--space-4) 0' }}>
                  No remediation actions required. All audited properties are optimal.
                </div>
              )}
            </div>

            <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
              <Button
                variant="primary"
                fullWidth
                onClick={() => onNavigateToFindings('all')}
                icon={<ArrowRight size={14} color="var(--color-ivory-light)" />}
              >
                Inspect All Findings ({totalFindings})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
