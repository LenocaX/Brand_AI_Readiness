import React, { useMemo } from 'react';
import { AuditReport, Finding } from '../types/audit';
import { PageHeading } from '../design-system/PageHeading';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';

export interface FindingsViewProps {
  report: AuditReport;
  selectedSeverity: string;
  onSeverityChange: (severity: string) => void;
  selectedSkill: string;
  onSkillChange: (skill: string) => void;
  selectedPage: string;
  onPageChange: (page: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
  onSelectFinding: (finding: Finding) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  report,
  selectedSeverity,
  onSeverityChange,
  selectedSkill,
  onSkillChange,
  selectedPage,
  onPageChange,
  searchQuery,
  onSearchChange,
  onResetFilters,
  onSelectFinding,
}) => {
  const findings = useMemo(() => {
    return Array.isArray(report?.findings) ? report.findings : [];
  }, [report]);

  // Extract unique specialist categories from findings
  const skills = useMemo(() => {
    const set = new Set<string>();
    findings.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).sort();
  }, [findings]);

  // Extract unique source URLs/pages from findings
  const pages = useMemo(() => {
    const set = new Set<string>();
    findings.forEach((f) => {
      if (f.source_url) set.add(f.source_url);
    });
    return Array.from(set).sort();
  }, [findings]);

  // Human-readable category label helper
  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'crawl_render':
      case 'crawlability':
        return 'Crawl & Render';
      case 'structured_data':
        return 'Structured Data';
      case 'content_extractability':
        return 'Content Extractability';
      case 'freshness_proof':
      case 'freshness':
        return 'Freshness & Proof';
      case 'engagement':
        return 'Engagement';
      case 'content_structure':
        return 'Content Structure';
      case 'metadata':
        return 'Metadata';
      case 'rendering':
        return 'Rendering';
      default:
        return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  // Severity counts reflecting the current category/page/search context
  const severityCounts = useMemo(() => {
    const baseList = findings.filter((f) => {
      const matchSkill = selectedSkill === 'all' || f.category === selectedSkill;
      const matchPage = selectedPage === 'all' || f.source_url === selectedPage;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        f.title?.toLowerCase().includes(query) ||
        f.id?.toLowerCase().includes(query) ||
        f.impact?.toLowerCase().includes(query) ||
        f.evidence?.toLowerCase().includes(query) ||
        f.source_url?.toLowerCase().includes(query) ||
        f.suggested_action?.summary?.toLowerCase().includes(query) ||
        f.category?.toLowerCase().includes(query);
      return matchSkill && matchPage && matchSearch;
    });

    return {
      all: baseList.length,
      critical: baseList.filter((f) => f.severity === 'critical').length,
      high: baseList.filter((f) => f.severity === 'high').length,
      medium: baseList.filter((f) => f.severity === 'medium').length,
      low: baseList.filter((f) => f.severity === 'low').length,
    };
  }, [findings, selectedSkill, selectedPage, searchQuery]);

  // Combined filtered findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity;
      const matchSkill = selectedSkill === 'all' || f.category === selectedSkill;
      const matchPage = selectedPage === 'all' || f.source_url === selectedPage;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        f.title?.toLowerCase().includes(query) ||
        f.id?.toLowerCase().includes(query) ||
        f.impact?.toLowerCase().includes(query) ||
        f.evidence?.toLowerCase().includes(query) ||
        f.source_url?.toLowerCase().includes(query) ||
        f.suggested_action?.summary?.toLowerCase().includes(query) ||
        f.category?.toLowerCase().includes(query);
      return matchSeverity && matchSkill && matchPage && matchSearch;
    });
  }, [findings, selectedSeverity, selectedSkill, selectedPage, searchQuery]);

  // Check if any filter is non-default
  const isFiltered =
    selectedSeverity !== 'all' ||
    selectedSkill !== 'all' ||
    selectedPage !== 'all' ||
    searchQuery.trim().length > 0;

  // Format page display name in dropdown
  const formatPageLabel = (url: string) => {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname === '/' ? 'Homepage (/)' : parsed.pathname;
      return `${path} (${parsed.hostname})`;
    } catch {
      return url;
    }
  };

  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
      <PageHeading
        eyebrow="AUDIT FINDINGS"
        title="Findings"
        subtitle="All issues detected during the audit with evidence and recommendations."
      />

      {/* Severity Filter Tabs matching Panel 4 */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
        role="tablist"
        aria-label="Severity filter"
      >
        {(['all', 'medium', 'low', 'critical', 'high'] as const).map((sev) => {
          const isActive = selectedSeverity === sev;
          const count = severityCounts[sev];
          const label = sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1);

          return (
            <button
              key={sev}
              onClick={() => onSeverityChange(sev)}
              role="tab"
              aria-selected={isActive}
              style={{
                padding: '6px 14px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-forest)' : 'var(--color-border)',
                backgroundColor: isActive ? 'var(--color-forest)' : 'var(--color-surface-white)',
                color: isActive ? 'var(--color-ivory-light)' : 'var(--color-charcoal)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search, Skill Dropdown, Page Dropdown Controls */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        {/* Search input with clear button */}
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <input
            className="input-field"
            placeholder="Search title, ID, evidence, URL..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', paddingRight: searchQuery ? '2rem' : '0.75rem' }}
            aria-label="Search findings by text"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-charcoal-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px',
                lineHeight: 1,
              }}
              title="Clear search"
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
        </div>

        {/* Skill Category Selector */}
        <div style={{ width: '190px' }}>
          <select
            value={selectedSkill}
            onChange={(e) => onSkillChange(e.target.value)}
            className="input-field"
            style={{ width: '100%', cursor: 'pointer' }}
            aria-label="Filter by specialist skill"
          >
            <option value="all">All Skills</option>
            {skills.map((s) => (
              <option key={s} value={s}>
                {categoryLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Page Selector (dynamically populated from source_url) */}
        <div style={{ width: '210px' }}>
          <select
            value={selectedPage}
            onChange={(e) => onPageChange(e.target.value)}
            className="input-field"
            style={{ width: '100%', cursor: 'pointer' }}
            aria-label="Filter by audited source page"
          >
            <option value="all">All Pages ({pages.length || 1})</option>
            {pages.map((p) => (
              <option key={p} value={p}>
                {formatPageLabel(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Status Bar with Reset Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-charcoal-muted)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span>
            Showing <strong style={{ color: 'var(--color-charcoal)' }}>{filteredFindings.length}</strong> of{' '}
            {findings.length} findings
          </span>
          {isFiltered && (
            <span
              style={{
                backgroundColor: 'var(--color-ivory-dark)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-forest)',
              }}
            >
              Filters Active
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--color-forest)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Findings List matching Panel 4 */}
      {filteredFindings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filteredFindings.map((f) => {
            const severityColor =
              f.severity === 'critical'
                ? 'var(--color-critical)'
                : f.severity === 'high'
                ? 'var(--color-high)'
                : f.severity === 'medium'
                ? 'var(--color-medium)'
                : 'var(--color-low)';

            return (
              <div
                key={f.id}
                onClick={() => onSelectFinding(f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectFinding(f);
                  }
                }}
                aria-label={`View details for ${f.id}: ${f.title}`}
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
                {/* Left: Indicator dot + ID + Title + Source URL badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: severityColor,
                      flexShrink: 0,
                    }}
                    title={`Severity: ${f.severity}`}
                  />
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--color-charcoal-muted)',
                      flexShrink: 0,
                      minWidth: '95px',
                    }}
                  >
                    {f.id}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        color: 'var(--color-charcoal)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {f.title}
                    </div>
                    {f.source_url && (
                      <div
                        className="font-mono"
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-charcoal-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}
                      >
                        {f.source_url}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Badges + Chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <Badge variant={f.severity}>
                    {f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}
                  </Badge>

                  <Badge variant="neutral">
                    {categoryLabel(f.category)}
                  </Badge>

                  <span
                    className="symbol-chevron-right"
                    style={{
                      color: 'var(--color-charcoal-muted)',
                      marginLeft: 'var(--space-1)',
                      fontSize: 'var(--text-xs)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Understandable Empty State */
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
            No Matching Findings
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
            No issues match the selected filter combination
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
            {isFiltered
              ? `Your active criteria (Severity: "${selectedSeverity}", Skill: "${categoryLabel(
                  selectedSkill
                )}"${searchQuery ? `, Search: "${searchQuery}"` : ''}) returned zero results.`
              : 'No audit findings were recorded for this target website.'}
          </p>
          {isFiltered && (
            <Button variant="secondary" size="sm" onClick={onResetFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
