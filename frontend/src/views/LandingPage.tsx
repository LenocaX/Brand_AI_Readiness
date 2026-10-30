import React, { useState } from 'react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { ArrowRight, StatusDot, ExternalLink } from '../design-system/Indicators';
import { sampleReport } from '../mock/sampleReport';

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
      <section style={{ padding: 'var(--space-8) 0 var(--space-10)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'var(--space-10)',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Headline, Description, Input Form */}
          <div>
            <div className="page-eyebrow">MAKE YOUR BRAND UNDERSTANDABLE TO AI</div>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
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
                fontSize: 'var(--text-base)',
                color: 'var(--color-charcoal-muted)',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-6)',
              }}
            >
              Audit discoverability, content, structure and user experience. Get evidence-backed findings and clear recommendations without invasive modifications.
            </p>

            {/* URL Submission Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-4)' }}>
              <div className="input-wrapper">
                <label htmlFor="landing-url-input" className="input-label">
                  Target Website URL
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <input
                    id="landing-url-input"
                    type="text"
                    className="input-field"
                    style={{
                      flex: '1 1 180px',
                      minWidth: '0',
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
                    disabled={isLoading}
                    icon={
                      isLoading ? (
                        <span className="symbol-dot" style={{ backgroundColor: 'var(--color-ivory-light)' }} />
                      ) : (
                        <ArrowRight size={14} color="var(--color-ivory-light)" />
                      )
                    }
                  >
                    {isLoading ? 'Starting Audit...' : 'Start Audit'}
                  </Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
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
                marginTop: 'var(--space-4)',
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

          {/* Right Column: Restrained Product Preview using real sample report data */}
          <div>
            <div
              style={{
                backgroundColor: 'var(--color-surface-white)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              {/* Minimal Browser Frame Header */}
              <div
                style={{
                  backgroundColor: 'var(--color-ivory)',
                  borderBottom: '1px solid var(--color-border)',
                  padding: 'var(--space-2) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-border)' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-border)' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-border)' }} />
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 'var(--text-2xs)',
                    color: 'var(--color-charcoal-muted)',
                    backgroundColor: 'var(--color-surface-white)',
                    border: '1px solid var(--color-border)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    flex: 1,
                  }}
                >
                  https://{sampleReport.site}
                </div>
              </div>

              {/* Sample Site Representation */}
              <div style={{ padding: 'var(--space-6)', position: 'relative' }}>
                <div
                  style={{
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-6)',
                    backgroundColor: 'var(--color-ivory-light)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    className="font-serif"
                    style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-charcoal)' }}
                  >
                    JitShelf
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', marginTop: '4px' }}>
                    Buy, Sell, Exchange. Within JIIT.
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: 'var(--text-xs)',
                        backgroundColor: 'var(--color-forest)',
                        color: 'var(--color-ivory-light)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Browse Listings
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: 'var(--text-xs)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-white)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Post an Item
                    </span>
                  </div>
                </div>

                {/* Overlaid Authentic Sample Score Badge */}
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    backgroundColor: 'var(--color-surface-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--color-charcoal-muted)', fontWeight: 600 }}>
                      AI Readability
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span className="font-serif" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}>
                        {sampleReport.readiness.score}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-subtle)' }}>/100</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <Badge variant="medium">
                      {sampleReport.readiness.label}
                    </Badge>
                    <button
                      onClick={onViewSample}
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-forest)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Inspect Sample Report →
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
            Review all 7 findings, confidence ratings, evidence snippets, and recommendations for jiitshelf.vercel.app.
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
