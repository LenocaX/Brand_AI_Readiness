import React, { useState, useMemo } from 'react';
import { AuditReport, Recommendation } from '../types/audit';
import { PageHeading } from '../design-system/PageHeading';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { DownloadIcon, CopyIcon, CheckIcon, ExternalLink } from '../design-system/Indicators';

export interface RecommendationsViewProps {
  report: AuditReport;
  onSelectRecommendation: (rec: Recommendation) => void;
  onDownloadReport: () => void;
  onNavigateToOverview: () => void;
  onNavigateToFindingDetail: (findingId: string) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  report,
  onSelectRecommendation,
  onDownloadReport,
  onNavigateToOverview,
  onNavigateToFindingDetail,
}) => {
  const [activeGroup, setActiveGroup] = useState<'all' | 'immediate' | 'longer_term'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);

  // Preserve authentic recommendations returned by backend
  const recommendations = useMemo(() => {
    return Array.isArray(report?.recommendations) ? report.recommendations : [];
  }, [report]);

  // Priority action IDs explicitly designated by the orchestrator
  const priorityActionIds = useMemo(() => {
    const list = Array.isArray(report?.priority_actions) ? report.priority_actions : [];
    return new Set(list.map((pa) => pa.finding_id));
  }, [report]);

  // Classify actions based strictly on supplied priority data without inventing new ones
  const { immediateFixes, longerTermImprovements } = useMemo(() => {
    const immediate: Recommendation[] = [];
    const longerTerm: Recommendation[] = [];

    recommendations.forEach((rec) => {
      const p = String(rec.priority || '').toLowerCase();
      const isExplicitPriorityAction = priorityActionIds.has(rec.finding_id);

      if (isExplicitPriorityAction || p === 'critical' || p === 'high' || p === 'medium') {
        immediate.push(rec);
      } else {
        longerTerm.push(rec);
      }
    });

    return { immediateFixes: immediate, longerTermImprovements: longerTerm };
  }, [recommendations, priorityActionIds]);

  // Determine which list to display based on selected tab
  const displayedRecommendations = useMemo(() => {
    if (activeGroup === 'immediate') return immediateFixes;
    if (activeGroup === 'longer_term') return longerTermImprovements;
    return recommendations;
  }, [activeGroup, recommendations, immediateFixes, longerTermImprovements]);

  // Clipboard copy handler with robust fallback and visual feedback
  const handleCopy = async (rec: Recommendation, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `Recommended Action: ${rec.title}\nPriority: ${rec.priority || 'N/A'}\nFinding ID: ${rec.finding_id}\nRemediation Plan: ${rec.action}${rec.source_url ? `\nTarget URL: ${rec.source_url}` : ''}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(rec.finding_id);
      setCopyErrorId(null);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setCopyErrorId(rec.finding_id);
      setTimeout(() => setCopyErrorId(null), 3000);
    }
  };

  const getPriorityVariant = (priority?: string) => {
    const p = String(priority || '').toLowerCase();
    if (p === 'critical') return 'critical';
    if (p === 'high') return 'high';
    if (p === 'medium') return 'medium';
    return 'low';
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Editorial Page Header */}
      <PageHeading
        eyebrow="ACTION PLAN"
        title="Recommended Actions"
        subtitle="Prioritized list of fixes to improve AI readiness."
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
              variant="ghost"
              size="sm"
              onClick={onNavigateToOverview}
            >
              Overview
            </Button>
          </div>
        }
      />

      {recommendations.length > 0 ? (
        <>
          {/* Grouping Filter Tabs (derived strictly from backend priorities) */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-5)',
              flexWrap: 'wrap',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: 'var(--space-3)',
            }}
            role="tablist"
            aria-label="Filter recommendations by timeframe"
          >
            <button
              onClick={() => setActiveGroup('all')}
              role="tab"
              aria-selected={activeGroup === 'all'}
              style={{
                padding: '6px 14px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: activeGroup === 'all' ? 'var(--color-forest)' : 'var(--color-border)',
                backgroundColor: activeGroup === 'all' ? 'var(--color-forest)' : 'var(--color-surface-white)',
                color: activeGroup === 'all' ? 'var(--color-ivory-light)' : 'var(--color-charcoal)',
                cursor: 'pointer',
              }}
            >
              All Actions ({recommendations.length})
            </button>

            {immediateFixes.length > 0 && (
              <button
                onClick={() => setActiveGroup('immediate')}
                role="tab"
                aria-selected={activeGroup === 'immediate'}
                style={{
                  padding: '6px 14px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: activeGroup === 'immediate' ? 'var(--color-forest)' : 'var(--color-border)',
                  backgroundColor: activeGroup === 'immediate' ? 'var(--color-forest)' : 'var(--color-surface-white)',
                  color: activeGroup === 'immediate' ? 'var(--color-ivory-light)' : 'var(--color-charcoal)',
                  cursor: 'pointer',
                }}
              >
                Immediate Fixes ({immediateFixes.length})
              </button>
            )}

            {longerTermImprovements.length > 0 && (
              <button
                onClick={() => setActiveGroup('longer_term')}
                role="tab"
                aria-selected={activeGroup === 'longer_term'}
                style={{
                  padding: '6px 14px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: activeGroup === 'longer_term' ? 'var(--color-forest)' : 'var(--color-border)',
                  backgroundColor: activeGroup === 'longer_term' ? 'var(--color-forest)' : 'var(--color-surface-white)',
                  color: activeGroup === 'longer_term' ? 'var(--color-ivory-light)' : 'var(--color-charcoal)',
                  cursor: 'pointer',
                }}
              >
                Longer-Term Improvements ({longerTermImprovements.length})
              </button>
            )}
          </div>

          {/* Recommendations List (Preserves exact backend priority ordering) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {displayedRecommendations.map((rec, idx) => {
              const priorityVariant = getPriorityVariant(rec.priority);
              const isCopied = copiedId === rec.finding_id;
              const isCopyError = copyErrorId === rec.finding_id;

              return (
                <div
                  key={rec.finding_id + idx}
                  onClick={() => onSelectRecommendation(rec)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectRecommendation(rec);
                    }
                  }}
                  aria-label={`Action ${idx + 1}: ${rec.title}. Priority ${rec.priority || 'standard'}.`}
                  style={{
                    backgroundColor: 'var(--color-surface-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4) var(--space-5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  {/* Left: Number badge + Text content */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-ivory)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--color-charcoal)',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-charcoal)' }}>
                          {rec.title}
                        </span>
                        {rec.finding_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToFindingDetail(rec.finding_id);
                            }}
                            className="font-mono"
                            title="Inspect related finding details"
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--color-forest)',
                              backgroundColor: 'var(--color-ivory)',
                              border: '1px solid var(--color-border)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                            }}
                          >
                            {rec.finding_id}
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-charcoal-muted)',
                          marginTop: '4px',
                          lineHeight: 'var(--leading-relaxed)',
                        }}
                      >
                        {rec.action}
                      </div>

                      {rec.source_url && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-charcoal-muted)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>Target:</span>
                          <a
                            href={rec.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              color: 'var(--color-forest)',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <span className="font-mono">{rec.source_url}</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Copy Button + Priority Badge + Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                    {/* Clipboard copy control with success/failure feedback */}
                    <button
                      onClick={(e) => handleCopy(rec, e)}
                      title="Copy recommendation text"
                      aria-label={`Copy action text for ${rec.title}`}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: isCopied ? 'var(--color-success-bg)' : 'var(--color-ivory)',
                        color: isCopied ? 'var(--color-success)' : isCopyError ? 'var(--color-critical)' : 'var(--color-charcoal)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        lineHeight: 1,
                      }}
                    >
                      {isCopied ? (
                        <>
                          <CheckIcon size={12} color="var(--color-success)" />
                          <span>Copied</span>
                        </>
                      ) : isCopyError ? (
                        <span>Copy Failed</span>
                      ) : (
                        <>
                          <CopyIcon size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Priority Badge */}
                    {rec.priority && (
                      <Badge variant={priorityVariant}>
                        {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                      </Badge>
                    )}

                    {/* Chevron to inspect */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecommendation(rec);
                      }}
                      title="Inspect finding details"
                      aria-label="Inspect finding details"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        color: 'var(--color-charcoal-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <span className="symbol-chevron-right" style={{ fontSize: 'var(--text-xs)' }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Useful Empty State */
        <div
          style={{
            backgroundColor: 'var(--color-surface-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-10) var(--space-6)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
              color: 'var(--color-charcoal-muted)',
              marginBottom: 'var(--space-2)',
            }}
          >
            0 Action Items
          </div>
          <h3
            className="font-serif"
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 500,
              color: 'var(--color-charcoal)',
              marginBottom: 'var(--space-3)',
            }}
          >
            No remediation actions required
          </h3>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-charcoal-muted)',
              maxWidth: '520px',
              margin: '0 auto var(--space-6)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            All evaluated machine-readability checks and engagement dimensions met optimal standards. No remediation steps are currently needed.
          </p>
          <Button variant="secondary" size="sm" onClick={onNavigateToOverview}>
            Back to Report Overview
          </Button>
        </div>
      )}
    </div>
  );
};
