import React, { useState, useEffect } from 'react';
import { PageHeading } from '../design-system/PageHeading';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Table, TableHeader, TableRow, TableCell } from '../design-system/Table';
import { AuditHistoryItem, ComparisonDiff, User, Website } from '../types/audit';
import { getWebsiteAuditHistory, compareAuditRuns } from '../api/client';

interface HistoryComparisonViewProps {
  website?: Website | null;
  onSelectAudit?: (auditId: string) => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

export const HistoryComparisonView: React.FC<HistoryComparisonViewProps> = ({
  website,
  onSelectAudit,
  currentUser,
  onOpenAuth,
}) => {
  const [tab, setTab] = useState<'timeline' | 'diff'>('timeline');
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);

  // Diff state
  const [selectedA, setSelectedA] = useState<string>('');
  const [selectedB, setSelectedB] = useState<string>('');
  const [diff, setDiff] = useState<ComparisonDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  useEffect(() => {
    if (currentUser && website?.id) {
      getWebsiteAuditHistory(website.id)
        .then((items) => {
          setHistory(items);
          if (items.length >= 2) {
            setSelectedA(items[1].id);
            setSelectedB(items[0].id);
          } else if (items.length === 1) {
            setSelectedB(items[0].id);
          }
        })
        .catch(() => setHistory([]));
    } else {
      setHistory([]);
    }
  }, [website?.id, currentUser]);

  const handleRunDiff = async () => {
    if (!selectedA || !selectedB) return;
    setDiffLoading(true);
    try {
      const res = await compareAuditRuns(selectedA, selectedB);
      setDiff(res);
    } catch (err: any) {
      console.warn('Diff error:', err);
    } finally {
      setDiffLoading(false);
    }
  };

  // If user is not signed in, do not show website history
  if (!currentUser) {
    return (
      <div style={{ maxWidth: '800px', margin: 'var(--space-10) auto', padding: '0 var(--space-4)' }}>
        <div
          style={{
            backgroundColor: 'var(--color-surface-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-10) var(--space-8)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🔒</div>
          <h2
            className="font-serif"
            style={{
              fontSize: 'var(--text-2xl)',
              color: 'var(--color-charcoal)',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}
          >
            Sign In to View Website Audit History
          </h2>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-charcoal-muted)',
              maxWidth: '520px',
              margin: '0 auto var(--space-6)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Historical audit logs, score timelines, and regression diffing are saved for registered accounts. Please sign in or create an account to view and compare historical audits.
          </p>
          {onOpenAuth && (
            <Button variant="primary" onClick={onOpenAuth}>
              Sign In or Register
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
      <PageHeading
        eyebrow="PROGRESS & INTELLIGENCE"
        title="Audit History & Progress Comparison"
        subtitle="Compare website improvements over time and track resolved findings between audit runs."
      />

      {/* View Sub-Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('timeline')}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            border: 'none',
            background: 'none',
            fontSize: 'var(--text-sm)',
            fontWeight: tab === 'timeline' ? 600 : 400,
            color: tab === 'timeline' ? 'var(--color-forest)' : 'var(--color-charcoal-muted)',
            borderBottom: tab === 'timeline' ? '2px solid var(--color-forest)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Historical Timeline
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('diff');
            if (!diff && selectedA && selectedB) handleRunDiff();
          }}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            border: 'none',
            background: 'none',
            fontSize: 'var(--text-sm)',
            fontWeight: tab === 'diff' ? 600 : 400,
            color: tab === 'diff' ? 'var(--color-forest)' : 'var(--color-charcoal-muted)',
            borderBottom: tab === 'diff' ? '2px solid var(--color-forest)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Before & After Diff
        </button>
      </div>

      {/* 1. TIMELINE TAB */}
      {tab === 'timeline' && (
        <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-6)' }}>
          <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: '0 0 var(--space-4) 0' }}>
            Historical Audit Runs ({history.length})
          </h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-charcoal-muted)', fontSize: 'var(--text-xs)' }}>
              No audits on record yet for this website. Run your initial audit to start tracking progress.
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <TableHeader>Audit Timestamp</TableHeader>
                  <TableHeader align="right">AI Readiness</TableHeader>
                  <TableHeader align="right">Engagement Score</TableHeader>
                  <TableHeader align="right">Total Findings</TableHeader>
                  <TableHeader>Severity Breakdown</TableHeader>
                  <TableHeader align="right">Actions</TableHeader>
                </tr>
              </thead>
              <tbody>
                {history.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                        {new Date(run.completed_at).toLocaleDateString()} &middot; {new Date(run.completed_at).toLocaleTimeString()}
                      </div>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>{run.id}</span>
                    </TableCell>
                    <TableCell align="right">
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: run.readiness_score >= 75 ? 'var(--color-success)' : 'var(--color-critical)' }}>
                        {run.readiness_score}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{run.engagement_score}</span>
                    </TableCell>
                    <TableCell align="right">{run.total_findings}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {run.severity_summary?.critical > 0 && <Badge variant="critical">{run.severity_summary.critical} crit</Badge>}
                        {run.severity_summary?.high > 0 && <Badge variant="high">{run.severity_summary.high} high</Badge>}
                        {run.severity_summary?.medium > 0 && <Badge variant="medium">{run.severity_summary.medium} med</Badge>}
                        {run.severity_summary?.low > 0 && <Badge variant="low">{run.severity_summary.low} low</Badge>}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      {onSelectAudit && (
                        <Button variant="outline" size="sm" onClick={() => onSelectAudit(run.id)}>
                          View Report
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {/* 2. DIFF TAB */}
      {tab === 'diff' && (
        <div>
          {/* Audit Selector Header */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)', marginBottom: '4px' }}>
                  PREVIOUS AUDIT (BASELINE)
                </label>
                <select
                  value={selectedA}
                  onChange={(e) => setSelectedA(e.target.value)}
                  style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                >
                  {history.map((h) => (
                    <option key={h.id} value={h.id}>
                      {new Date(h.completed_at).toLocaleDateString()} (Score: {h.readiness_score})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)', marginBottom: '4px' }}>
                  LATEST AUDIT (COMPARISON)
                </label>
                <select
                  value={selectedB}
                  onChange={(e) => setSelectedB(e.target.value)}
                  style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                >
                  {history.map((h) => (
                    <option key={h.id} value={h.id}>
                      {new Date(h.completed_at).toLocaleDateString()} (Score: {h.readiness_score})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button variant="primary" size="sm" onClick={handleRunDiff} disabled={diffLoading || !selectedA || !selectedB}>
              {diffLoading ? 'Diffing...' : 'Compare Audits'}
            </Button>
          </div>

          {diff && (
            <>
              {/* Score Delta Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-6)',
                  marginBottom: 'var(--space-6)',
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>Baseline Score</div>
                  <div className="font-serif" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600 }}>
                    {diff.previous_score}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>Score Trajectory</div>
                  <div
                    className="font-serif"
                    style={{
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 700,
                      color: diff.score_delta >= 0 ? 'var(--color-success)' : 'var(--color-critical)',
                    }}
                  >
                    {diff.score_delta >= 0 ? `+${diff.score_delta}` : diff.score_delta} pts
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>Latest Score</div>
                  <div className="font-serif" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600 }}>
                    {diff.latest_score}
                  </div>
                </div>
              </div>

              {/* Finding Resolution Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
                {/* Resolved Findings */}
                <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Badge variant="success">{diff.resolved_findings.length} Resolved</Badge>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal)' }}>Issues Fixed</span>
                  </div>
                  {diff.resolved_findings.length === 0 ? (
                    <div style={{ color: 'var(--color-charcoal-muted)', fontSize: 'var(--text-xs)', padding: 'var(--space-4) 0' }}>
                      No resolved findings detected between these runs.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {diff.resolved_findings.map((f) => (
                        <div key={f.fingerprint} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                          <span style={{ fontWeight: 600 }}>{f.finding_code}: {f.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* New Findings (Regressions) */}
                <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Badge variant="critical">{diff.new_findings.length} New</Badge>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal)' }}>New Regressions</span>
                  </div>
                  {diff.new_findings.length === 0 ? (
                    <div style={{ color: 'var(--color-charcoal-muted)', fontSize: 'var(--text-xs)', padding: 'var(--space-4) 0' }}>
                      Zero new issues introduced. Excellent!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {diff.new_findings.map((f) => (
                        <div key={f.fingerprint} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-critical-bg)', border: '1px solid var(--color-critical-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                          <span style={{ fontWeight: 600 }}>{f.finding_code}: {f.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
