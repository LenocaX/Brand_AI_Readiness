import React, { useState } from 'react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { ArrowRight, StatusDot, ExternalLink } from '../design-system/Indicators';

export interface LandingPageProps {
  onStartAudit: (url: string) => void;
  onViewSample: () => void;
  isLoading: boolean;
  errorMessage?: string;
  onOpenAbout: () => void;
  onOpenHowItWorks: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAudit,
  onViewSample,
  isLoading,
  errorMessage,
  onOpenAbout,
  onOpenHowItWorks,
}) => {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateUrl = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) {
      return 'Please enter a website URL.';
    }

    let parsed: URL;
    try {
      // Check for non-HTTP protocol like ftp://, file://, etc.
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
        if (!/^https?:\/\//i.test(trimmed)) {
          return 'URL must start with http:// or https://.';
        }
        parsed = new URL(trimmed);
      } else {
        parsed = new URL(`https://${trimmed}`);
      }
    } catch {
      return 'Please enter a valid website URL (e.g., https://example.com).';
    }

    // SSRF / Local address sanity check
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return 'Local and private network addresses cannot be audited by the public engine.';
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return 'Please include a valid domain name with an extension (e.g. .com, .org, .app).';
    }

    return null;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return; // Prevent repeated clicks while in progress

    const error = validateUrl(url);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError('');
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }
    onStartAudit(finalUrl);
  };

  const activeError = validationError || errorMessage;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Hero Section */}
      <section style={{ padding: 'var(--space-10) 0 var(--space-12)', maxWidth: '840px', margin: '0 auto' }}>
        <div>
          <div className="page-eyebrow">CANOPY &middot; BRAND AI-READINESS AUDIT</div>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)',
              fontWeight: 500,
              lineHeight: 'var(--leading-tight)',
              color: 'var(--color-charcoal)',
              marginBottom: 'var(--space-4)',
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            See how AI and visitors interpret your website.
          </h1>

          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--color-charcoal-muted)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-8)',
              maxWidth: '700px',
            }}
          >
            Canopy audits your website&apos;s AI discoverability, content extractability, structured data, and visitor orientation. Get clear, evidence-backed findings and actionable recommendations without invasive modifications.
          </p>

          {/* URL Submission Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-4)' }}>
            <div className="input-wrapper" style={{ maxWidth: '640px' }}>
              <label htmlFor="landing-url-input" className="input-label">
                Target Website URL
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <input
                  id="landing-url-input"
                  type="text"
                  className="input-field"
                  style={{
                    flex: '1 1 240px',
                    minWidth: '0',
                    fontSize: 'var(--text-base)',
                    padding: '0.75rem 1rem',
                    borderColor: activeError ? 'var(--color-critical)' : undefined,
                  }}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit();
                    }
                  }}
                  placeholder="https://example.com"
                  disabled={isLoading}
                  aria-invalid={!!activeError}
                  aria-describedby={activeError ? 'url-error-msg' : 'url-helper-msg'}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  icon={
                    isLoading ? (
                      <span className="symbol-dot" style={{ backgroundColor: 'var(--color-ivory-light)' }} />
                    ) : (
                      <ArrowRight size={16} color="var(--color-ivory-light)" />
                    )
                  }
                >
                  {isLoading ? 'Starting Audit...' : 'Start Audit'}
                </Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {activeError ? (
                  <span id="url-error-msg" className="input-error" role="alert">
                    {activeError}
                  </span>
                ) : (
                  <span id="url-helper-msg" className="input-hint">
                    Enter any public HTTP or HTTPS web address to begin inspection.
                  </span>
                )}
                <button
                  type="button"
                  onClick={onViewSample}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-forest)',
                    fontSize: 'var(--text-xs)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  View Sample Report &rarr;
                </button>
              </div>
            </div>
          </form>

          {/* Security and Privacy Assurance Badges */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              marginTop: 'var(--space-5)',
            }}
          >
            <Badge variant="neutral" showDot>
              Read-only audit
            </Badge>
            <Badge variant="neutral" showDot>
              Public website only
            </Badge>
            <Badge variant="neutral" showDot>
              No data is stored
            </Badge>
          </div>
        </div>
      </section>

      {/* Factual Explanation of Process & Data Handling */}
      <section
        style={{
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-6) 0',
          backgroundColor: 'var(--color-ivory)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-charcoal)' }}>
              Non-Invasive, Read-Only Auditing Pipeline
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>
              The audit engine performs standard HTTP GET inspections. It does not store user credentials, modify website content, or submit forms.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              onClick={onOpenHowItWorks}
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--color-forest)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              How It Works →
            </button>
            <button
              onClick={onOpenAbout}
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--color-forest)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              About the Platform →
            </button>
          </div>
        </div>
      </section>

      {/* Five Specialist Audit Capabilities Explanation */}
      {/* Formatted in a compliant 2-column editorial structure, avoiding 3 cards in one row */}
      <section style={{ padding: 'var(--space-10) 0 var(--space-8)' }}>
        <div className="page-eyebrow">FIVE SPECIALIST AUDIT CAPABILITIES</div>
        <h2
          className="font-serif"
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 500,
            color: 'var(--color-charcoal)',
            marginBottom: 'var(--space-6)',
          }}
        >
          Rigorous analysis from crawler entry to visitor orientation.
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {/* Capability 1 */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-forest)',
                  color: 'var(--color-ivory-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Crawl & Render Audit</h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', lineHeight: 'var(--leading-relaxed)' }}>
              Detects HTTP 4xx/5xx crawl barriers, evaluates title tags, meta descriptions, and verifies client-side JavaScript rendering behavior against raw HTML.
            </p>
          </div>

          {/* Capability 2 */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-forest)',
                  color: 'var(--color-ivory-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Structured Data Audit</h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', lineHeight: 'var(--leading-relaxed)' }}>
              Inspects Schema.org JSON-LD blocks, verifies required entity properties, and checks semantic metadata essential for AI knowledge graph ingestion.
            </p>
          </div>

          {/* Capability 3 */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-forest)',
                  color: 'var(--color-ivory-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Content Extractability</h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', lineHeight: 'var(--leading-relaxed)' }}>
              Measures explicit machine-readable text density, audits descriptive image alt attributes, and checks that core facts are not hidden inside non-text elements.
            </p>
          </div>

          {/* Capability 4 */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-forest)',
                  color: 'var(--color-ivory-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                4
              </div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Freshness & Proof</h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', lineHeight: 'var(--leading-relaxed)' }}>
              Validates date markers, copyright currency, and verifies whether factual statements and assertions provide supporting corroboration.
            </p>
          </div>

          {/* Capability 5 */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--color-forest)',
                  color: 'var(--color-ivory-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                5
              </div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Engagement Audit</h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', lineHeight: 'var(--leading-relaxed)' }}>
              Evaluates heading hierarchy (H1 presence), primary navigation clarity, call-to-action discoverability, and flags dead-end navigation states.
            </p>
          </div>

          {/* Orchestrator Summary */}
          <div
            style={{
              backgroundColor: 'var(--color-ivory-light)',
              border: '1px solid var(--color-forest-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <StatusDot status="completed" size={10} />
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-forest)' }}>
                Audit Orchestrator & Scoring
              </h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', lineHeight: 'var(--leading-relaxed)' }}>
              Deduplicates findings, computes readiness and engagement scores from 0–100, assigns severity priorities, and validates output against the report schema.
            </p>
          </div>
        </div>
      </section>

      {/* Action Footer Callout */}
      <section
        style={{
          marginTop: 'var(--space-8)',
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h4 className="font-serif" style={{ fontSize: 'var(--text-lg)', fontWeight: 500, color: 'var(--color-charcoal)' }}>
            Explore an authentic audit before running yours
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>
            Review findings, confidence ratings, evidence snippets, and recommendations from our sample audit report.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={onViewSample}
          icon={<ExternalLink size={14} />}
        >
          Open Sample Report
        </Button>
      </section>
    </div>
  );
};
