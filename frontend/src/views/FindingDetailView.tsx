import React, { useState, useEffect, useRef } from 'react';
import { Finding, Recommendation } from '../types/audit';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { ExternalLink } from '../design-system/Indicators';

export type FindingDetailTab = 'overview' | 'evidence' | 'remediation' | 'inspector';

export interface FindingDetailViewProps {
  finding: Finding;
  siteUrl: string;
  auditedAt?: string;
  reportRecommendations?: Recommendation[];
  activeFilterSummary?: string;
  onBack: () => void;
}

export const FindingDetailView: React.FC<FindingDetailViewProps> = ({
  finding,
  siteUrl,
  auditedAt,
  reportRecommendations = [],
  activeFilterSummary,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<FindingDetailTab>('overview');
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  // Reset tab to overview and reset copy state when finding changes
  useEffect(() => {
    setActiveTab('overview');
    setCopied(false);
  }, [finding.id]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

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
        return cat ? cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Audit Specialist';
    }
  };

  const categoryScript = (cat: string) => {
    switch (cat) {
      case 'crawl_render':
      case 'crawlability':
      case 'metadata':
      case 'rendering':
        return 'skills/crawl-render-audit/scripts/audit.py';
      case 'structured_data':
        return 'skills/structured-data-audit/scripts/audit.py';
      case 'content_extractability':
      case 'content_structure':
        return 'skills/content-extractability/scripts/audit.py';
      case 'freshness_proof':
      case 'freshness':
        return 'skills/freshness-proof-audit/scripts/audit.py';
      case 'engagement':
        return 'skills/engagement-audit/scripts/audit.py';
      default:
        return 'skills/audit-orchestrator/scripts/audit.py';
    }
  };

  const getWhyIssueMatters = (cat: string, sev: string): string => {
    switch (cat) {
      case 'crawl_render':
      case 'crawlability':
      case 'metadata':
      case 'rendering':
        return 'Autonomous AI agents and search bots rely on reliable HTTP status codes, well-formed HTML document titles, and canonical metadata to discover and crawl pages. If a page cannot be retrieved or lacks baseline metadata, downstream LLM indexing pipelines will exclude it from retrieval-augmented generation (RAG) indices.';
      case 'structured_data':
        return 'Structured Schema.org markup provides explicit, machine-readable facts about entities, organizations, and products. Without structured data, AI systems must infer relationships heuristically, increasing the risk of entity confusion, hallucinated attributes, and exclusion from specialized search surfaces.';
      case 'content_extractability':
      case 'content_structure':
        return 'LLMs and automated summarizers extract explicit, indexable textual content from the DOM. When content is locked inside images, dynamically rendered without server hydration, or obscured by excessive markup noise, AI extractors fail to grasp the core facts and value proposition of your brand.';
      case 'freshness_proof':
      case 'freshness':
        return 'AI search engines evaluate date stamps, copyright currency, and corroboration citations to verify temporal accuracy. Outdated or unverified claims reduce source credibility scores and cause AI engines to prefer competing sources with verifiable proof signals.';
      case 'engagement':
        return 'Clear semantic headings (H1-H3), intuitive navigation links, and well-defined calls to action allow both human visitors and automated browser agents to traverse the site without getting trapped in dead-end workflows or losing contextual orientation.';
      default:
        return `This ${sev} severity finding impacts how automated auditing systems and machine-learning crawlers perceive, index, and score the target website.`;
    }
  };

  const getImplementationGuidance = (finding: Finding): { title: string; steps: string[] } => {
    const cat = finding.category;
    switch (cat) {
      case 'crawl_render':
      case 'crawlability':
      case 'metadata':
        return {
          title: 'Metadata & Response Remediation',
          steps: [
            'Ensure the target server responds with standard HTTP 200 OK headers for public requests.',
            'Insert a descriptive <title> tag (50-60 characters) and a meaningful <meta name="description"> (120-160 characters) directly within the server-rendered HTML <head>.',
            'Include Open Graph tags (<meta property="og:title">, <meta property="og:description">, <meta property="og:url">) to ensure consistent link previews across social platforms and messaging apps.',
            'Confirm robots.txt allows access to user-facing paths and that no restrictive meta robots tags ("noindex", "none") block automated discovery.',
          ],
        };
      case 'structured_data':
        return {
          title: 'Schema.org JSON-LD Implementation',
          steps: [
            'Select the appropriate Schema.org entity type corresponding to your site (e.g. Organization, WebSite, Article, Product).',
            'Add a <script type="application/ld+json"> tag into the page <head> containing valid, validated JSON.',
            'Define core properties: "@context": "https://schema.org", "@type", "name", "url", and "description".',
            'Validate the markup using Google\'s Rich Results Test or the Schema.org Validator before deploying to production.',
          ],
        };
      case 'content_extractability':
      case 'content_structure':
        return {
          title: 'Semantic Text Extractability Guidance',
          steps: [
            'Ensure the primary message, brand identity, and key offerings are rendered as plain readable HTML text (<p>, <span>, <li>) rather than burned into bitmap images or canvas graphics.',
            'Provide informative alt attributes (alt="...") on all content-bearing <img> elements.',
            'Ensure single-page application (SPA) content is pre-rendered or server-side rendered (SSR) so AI crawlers that do not execute client scripts receive complete markup on the first network pass.',
            'Organize copy with logical section dividers and maintain sufficient text-to-markup density.',
          ],
        };
      case 'freshness_proof':
      case 'freshness':
        return {
          title: 'Freshness & Corroboration Remediation',
          steps: [
            'Add machine-readable publication and modification dates using <time datetime="YYYY-MM-DD"> tags or Schema.org datePublished / dateModified properties.',
            'Update the copyright notice in the global footer to reflect the current calendar year.',
            'Where statistical claims, pricing, or product specifications are presented, provide verifiable citations or links to official documentation.',
            'Regularly review and refresh outdated copy on key landing pages to maintain high crawl recency.',
          ],
        };
      case 'engagement':
        return {
          title: 'Information Architecture & Engagement Guidance',
          steps: [
            'Ensure exactly one clear, descriptive <h1> heading is present on the page, establishing the primary topic.',
            'Nest subsequent heading levels hierarchically (<h2> for major sections, <h3> for sub-points) without skipping levels.',
            'Provide an accessible <nav> landmark containing consistent navigation links to key sections.',
            'Eliminate navigation dead ends by including clear calls to action, related links, or a pathway back to main directories.',
          ],
        };
      default:
        return {
          title: 'General Technical Remediation',
          steps: [
            'Review the specific evidence snippet recorded by the audit specialist.',
            'Update the relevant HTML markup, HTTP response headers, or configuration files.',
            'Verify the change in staging before re-running the Brand AI-Readiness Audit.',
          ],
        };
    }
  };

  const hasConfidence = typeof finding?.confidence === 'number' && !isNaN(finding.confidence);
  const confidencePct = hasConfidence ? Math.round(finding.confidence * 100) : null;
  const hasImpact = Boolean(finding?.impact && finding.impact.trim());
  const hasEvidence = Boolean(finding?.evidence && finding.evidence.trim());
  const hasSourceUrl = Boolean(finding?.source_url && finding.source_url.trim());

  // Match recommendation from report.recommendations
  const matchingRecommendation = reportRecommendations.find((r) => r.finding_id === finding.id);

  // Remediation action text
  const recommendationActionText =
    finding.suggested_action?.summary ||
    matchingRecommendation?.action ||
    `Review and resolve the observed ${finding.title.toLowerCase()} condition on ${finding.source_url || siteUrl}.`;

  const handleCopyRecommendation = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(recommendationActionText)
        .then(() => {
          setCopied(true);
          if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
          copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2500);
        })
        .catch((err) => {
          console.warn('Clipboard write failed:', err);
        });
    }
  };

  // Extract parsed host safely
  const parsedHost = (() => {
    try {
      const u = finding.source_url || (siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
      return new URL(u).hostname;
    } catch {
      return siteUrl.replace(/^https?:\/\//, '').split('/')[0];
    }
  })();

  const tabs: { id: FindingDetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: 'Technical Evidence' },
    { id: 'remediation', label: 'Remediation' },
    { id: 'inspector', label: 'Inspector Context' },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTabId: FindingDetailTab) => {
    const currentIndex = tabs.findIndex((t) => t.id === currentTabId);
    let nextIndex = -1;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextTab = tabs[nextIndex].id;
      setActiveTab(nextTab);
      const nextBtn = document.getElementById(`tab-${nextTab}`);
      if (nextBtn) nextBtn.focus();
    }
  };

  const guidance = getImplementationGuidance(finding);

  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
      {/* Accessible Breadcrumb Navigation */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--color-charcoal-muted)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          marginBottom: 'var(--space-4)',
        }}
        aria-label="Return to filtered findings list"
      >
        <span className="symbol-chevron-left">
          Back to findings{activeFilterSummary ? ` (${activeFilterSummary})` : ''}
        </span>
      </button>

      {/* Main Detail Container */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-8)',
        }}
      >
        {/* Eyebrow & Status */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
              color: 'var(--color-charcoal-muted)',
            }}
          >
            Finding Details
          </span>
        </div>

        {/* Title, ID & Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 300px' }}>
            <div
              className="font-mono"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--color-charcoal-muted)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {finding.id}
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 600,
                color: 'var(--color-charcoal)',
                marginBottom: 'var(--space-3)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {finding.title}
            </h1>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge variant="neutral">{categoryLabel(finding.category)}</Badge>
              {hasConfidence && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-charcoal-muted)',
                    alignSelf: 'center',
                  }}
                >
                  Confidence: {confidencePct}%
                </span>
              )}
            </div>
          </div>

          <div>
            <Badge variant={finding.severity}>
              {finding.severity ? finding.severity.toUpperCase() : 'UNKNOWN'}
            </Badge>
          </div>
        </div>

        {/* Section Navigation Tabs (WAI-ARIA Pattern) */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            marginTop: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
            flexWrap: 'wrap',
          }}
          role="tablist"
          aria-label="Finding detail views"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                style={{
                  padding: 'var(--space-2) 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--color-forest)' : '2px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-forest)' : 'var(--color-charcoal-muted)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  outline: 'none',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Finding Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--color-ivory)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-charcoal-muted)' }}>Finding: </span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>{finding.id}</span>
                  <span style={{ color: 'var(--color-charcoal-muted)', margin: '0 8px' }}>·</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-charcoal)' }}>{finding.title}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Badge variant="neutral">{categoryLabel(finding.category)}</Badge>
                  <Badge variant={finding.severity}>{finding.severity.toUpperCase()}</Badge>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Finding Description
                </h3>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-charcoal)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}
                >
                  {finding.impact || finding.evidence || 'Audit finding recorded by specialist evaluation skill.'}
                </p>
              </div>

              {/* Potential Impact */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Potential Impact
                </h3>
                <div
                  style={{
                    backgroundColor: 'var(--color-ivory-light)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-charcoal)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}
                >
                  {hasImpact
                    ? finding.impact
                    : `This ${finding.severity} severity finding was flagged because it diminishes the ability of search and AI agents to reliably parse the target page.`}
                </div>
              </div>

              {/* Why This Issue Matters to AI Systems */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Why This Matters to AI Discovery
                </h3>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-white)',
                    border: '1px solid var(--color-border)',
                    borderLeft: '4px solid var(--color-forest)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4) var(--space-5)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-charcoal)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}
                >
                  {getWhyIssueMatters(finding.category, finding.severity)}
                </div>
              </div>

              {/* Evidence At A Glance with Tab Jump */}
              <div
                style={{
                  backgroundColor: 'var(--color-ivory)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-4) var(--space-5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-charcoal-muted)', marginBottom: '2px' }}>
                    Observed Evidence Snapshot
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-charcoal)',
                      maxWidth: '600px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hasEvidence ? finding.evidence : 'No raw evidence string recorded'}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('evidence')}
                >
                  Inspect Technical Evidence
                </Button>
              </div>

              {/* Engine Confidence */}
              {hasConfidence && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <h3
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--tracking-wide)',
                        color: 'var(--color-charcoal-muted)',
                      }}
                    >
                      Specialist Engine Confidence
                    </h3>
                    <span className="font-mono" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      {confidencePct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: 'var(--color-ivory-dark)',
                      borderRadius: 'var(--radius-none)',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${confidencePct}%`,
                        backgroundColor: 'var(--color-forest)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Audited Source URL */}
              {hasSourceUrl && (
                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-4)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wide)',
                      color: 'var(--color-charcoal-muted)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Audited Source Page
                  </h3>
                  <a
                    href={finding.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-forest)',
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'var(--font-mono)',
                      wordBreak: 'break-all',
                    }}
                  >
                    <span>{finding.source_url}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: TECHNICAL EVIDENCE */}
        {/* ================================================================= */}
        {activeTab === 'evidence' && (
          <div id="tabpanel-evidence" role="tabpanel" aria-labelledby="tab-evidence">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Actual Observed Evidence */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wide)',
                      color: 'var(--color-charcoal-muted)',
                    }}
                  >
                    Observed Technical Evidence (Audit Record)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-charcoal-muted)' }}>
                    Authentic engine observation
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--color-ivory)',
                    border: '1px solid var(--color-border)',
                    padding: 'var(--space-4)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 'var(--leading-relaxed)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-charcoal)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {hasEvidence ? finding.evidence : 'No raw textual evidence string was recorded for this finding.'}
                </div>
              </div>

              {/* Source URL & Scope */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Evidence Source & Scope
                </h3>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ color: 'var(--color-charcoal-muted)' }}>Source URL</span>
                    <a
                      href={finding.source_url || siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono"
                      style={{ color: 'var(--color-forest)', textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {finding.source_url || siteUrl}
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-charcoal-muted)' }}>Detection Category</span>
                    <span style={{ fontWeight: 500 }}>{categoryLabel(finding.category)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-charcoal-muted)' }}>Specialist Script</span>
                    <span className="font-mono" style={{ color: 'var(--color-charcoal-muted)' }}>{categoryScript(finding.category)}</span>
                  </div>
                </div>
              </div>

              {/* Technical Telemetry Collection Status */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Technical Telemetry Breakdown
                </h3>
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-ivory)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }}>Telemetry Property</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }}>Observed Status / Payload</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)' }}>Finding String Evidence</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                          {hasEvidence ? 'Collected and verified' : 'Not available'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)' }}>HTTP Response Headers</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>
                          Not collected in this audit
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)' }}>HTML DOM Snippet</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>
                          Not collected in this audit
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)' }}>Structured JSON-LD Entities</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                          {finding.category === 'structured_data' && hasEvidence ? 'Inspected in markup' : 'Not collected in this audit'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)' }}>Raw vs Rendered DOM Diff</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>
                          Not collected in this audit
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Integrity Notice */}
              <div
                style={{
                  backgroundColor: 'var(--color-ivory-light)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-charcoal-muted)',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '2px' }}>
                  Telemetry Integrity Guarantee
                </div>
                Uncollected fields are explicitly reported as &ldquo;Not collected in this audit&rdquo;. This platform strictly presents authentic recorded findings and never synthesizes fictional response headers, DOM subtrees, or network payloads.
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: REMEDIATION */}
        {/* ================================================================= */}
        {activeTab === 'remediation' && (
          <div id="tabpanel-remediation" role="tabpanel" aria-labelledby="tab-remediation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Primary Recommended Action Card */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wide)',
                      color: 'var(--color-charcoal-muted)',
                    }}
                  >
                    Recommended Action
                  </h3>
                  <Badge variant={finding.severity}>
                    {finding.suggested_action?.priority
                      ? `PRIORITY: ${finding.suggested_action.priority.toUpperCase()}`
                      : `SEVERITY: ${finding.severity.toUpperCase()}`}
                  </Badge>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-ivory-light)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-5)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                      color: 'var(--color-charcoal)',
                      lineHeight: 'var(--leading-relaxed)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    {recommendationActionText}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCopyRecommendation}
                    >
                      {copied ? '✓ Copied to Clipboard' : 'Copy Recommendation'}
                    </Button>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>
                      Related finding: <span className="font-mono">{finding.id}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Why The Fix Is Necessary */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Why This Fix Is Necessary
                </h3>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-charcoal)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}
                >
                  {hasImpact
                    ? `Resolving this issue addresses the observed impact: ${finding.impact}`
                    : 'Remediating this issue ensures your brand markup satisfies automated discoverability standards and maintains high visibility across AI-driven indexing engines.'}
                </div>
              </div>

              {/* Practical Implementation Guidance */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--color-charcoal-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Practical Implementation Guidance: {guidance.title}
                </h3>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-5)',
                  }}
                >
                  <ol
                    style={{
                      paddingLeft: 'var(--space-5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-charcoal)',
                      lineHeight: 'var(--leading-relaxed)',
                    }}
                  >
                    {guidance.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Report Recommendation Mapping */}
              {matchingRecommendation && (
                <div
                  style={{
                    backgroundColor: 'var(--color-ivory)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                    Engine Action Plan Mapping
                  </div>
                  <div style={{ color: 'var(--color-charcoal-muted)', marginBottom: '2px' }}>
                    Plan Title: <span style={{ color: 'var(--color-charcoal)', fontWeight: 500 }}>{matchingRecommendation.title}</span>
                  </div>
                  <div style={{ color: 'var(--color-charcoal-muted)' }}>
                    Priority: <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{matchingRecommendation.priority}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: INSPECTOR CONTEXT */}
        {/* ================================================================= */}
        {activeTab === 'inspector' && (
          <div id="tabpanel-inspector" role="tabpanel" aria-labelledby="tab-inspector">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Browser Mock Frame Header */}
              <div
                style={{
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
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'inline-block' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'inline-block' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'inline-block' }} />
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-charcoal-muted)',
                      margin: '0 auto',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '380px',
                    }}
                  >
                    {finding.source_url || siteUrl}
                  </div>
                </div>

                <div style={{ padding: 'var(--space-5)' }}>
                  {/* Capture Scope Notice */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-ivory-light)',
                      border: '1px solid var(--color-border)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-5)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-charcoal-muted)',
                      lineHeight: 'var(--leading-normal)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                      Audit Capture Scope Notice
                    </div>
                    The current audit schema inspects HTML text extractability, Schema.org entities, HTTP response status, heading hierarchies, and freshness signals. Raw-versus-rendered DOM diff trees and graphical viewport screenshots are beyond the current deterministic engine boundary.
                  </div>

                  {/* Audit Context Metadata Table */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Target Host</span>
                      <span className="font-mono" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>
                        {parsedHost}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Audited Source URL</span>
                      <span className="font-mono" style={{ color: 'var(--color-forest)', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {finding.source_url || siteUrl}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Specialist Skill</span>
                      <span style={{ fontWeight: 500 }}>{categoryLabel(finding.category)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Engine Module</span>
                      <span className="font-mono" style={{ color: 'var(--color-charcoal-muted)' }}>{categoryScript(finding.category)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Finding Identifier</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>{finding.id}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Detection Severity</span>
                      <Badge variant={finding.severity}>
                        {finding.severity ? finding.severity.toUpperCase() : 'UNKNOWN'}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Confidence Rating</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>
                        {hasConfidence ? `${confidencePct}%` : 'Not evaluated'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-charcoal-muted)' }}>Audit Run Timestamp</span>
                      <span className="font-mono" style={{ color: 'var(--color-charcoal-muted)' }}>
                        {auditedAt ? new Date(auditedAt).toUTCString() : 'Active audit session'}
                      </span>
                    </div>
                  </div>

                  {/* Technical Observation Snippet */}
                  <div style={{ marginTop: 'var(--space-5)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Observation Snippet
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--color-ivory)',
                        border: '1px solid var(--color-border)',
                        padding: 'var(--space-3)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 'var(--leading-normal)',
                        color: 'var(--color-charcoal)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        borderRadius: 'var(--radius-sm)',
                        maxHeight: '160px',
                        overflowY: 'auto',
                      }}
                    >
                      {hasEvidence ? finding.evidence : 'No observation string recorded'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
