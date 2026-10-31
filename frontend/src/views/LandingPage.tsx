import React, { useState, useEffect } from 'react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { ArrowRight } from '../design-system/Indicators';
import { checkRepeatUrl } from '../api/client';
import { User } from '../types/audit';

export interface LandingPageProps {
  onStartAudit: (url: string) => void;
  onViewSample: () => void;
  isLoading: boolean;
  errorMessage?: string;
  onOpenAbout: () => void;
  onOpenHowItWorks: () => void;
  onViewPreviousAudit?: (auditId: string) => void;
  currentUser?: User | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAudit,
  onViewSample,
  isLoading,
  errorMessage,
  onViewPreviousAudit,
  currentUser,
}) => {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  const [repeatInfo, setRepeatInfo] = useState<any | null>(null);

  // Check repeat URL on debounce - ONLY for authenticated users
  useEffect(() => {
    if (!currentUser) {
      setRepeatInfo(null);
      return;
    }
    const trimmed = url.trim();
    if (trimmed.length > 4 && trimmed.includes('.')) {
      const timer = setTimeout(() => {
        checkRepeatUrl(trimmed)
          .then((res) => {
            if (res.last_audit || res.is_registered) {
              setRepeatInfo(res);
            } else {
              setRepeatInfo(null);
            }
          })
          .catch(() => setRepeatInfo(null));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRepeatInfo(null);
    }
  }, [url, currentUser]);

  const validateUrl = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) {
      return 'Please enter a website URL.';
    }

    let parsed: URL;
    try {
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
    if (isLoading) return;

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
          <div className="page-eyebrow">CANOPY &middot; UNIFIED WEBSITE INTELLIGENCE</div>
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
            See how AI search and visitors experience your website.
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
            Canopy unites AI discoverability, performance Core Web Vitals, and real-world visitor engagement into a single evidence-driven continuous intelligence platform.
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
                  placeholder="https://example.com"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  icon={<ArrowRight size={16} color="var(--color-ivory-light)" />}
                >
                  {isLoading ? 'Starting Audit...' : 'Audit Website'}
                </Button>
              </div>

              {/* Repeat URL Recognition Card - Only shown when user is signed in */}
              {Boolean(currentUser) && repeatInfo?.last_audit && (
                <div
                  style={{
                    marginTop: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--color-ivory-light)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal)' }}>
                    <strong>Historical Audit on Record:</strong> Audited on{' '}
                    {repeatInfo.last_audit.completed_at
                      ? new Date(repeatInfo.last_audit.completed_at).toLocaleDateString()
                      : 'recently'}{' '}
                    (Score: <strong>{repeatInfo.last_audit.readiness_score}/100</strong>)
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {onViewPreviousAudit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewPreviousAudit(repeatInfo.last_audit.id)}
                      >
                        View Previous Report
                      </Button>
                    )}
                    <Button type="submit" variant="primary" size="sm">
                      Run Fresh Audit
                    </Button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {activeError ? (
                  <span id="url-error-msg" className="input-error" role="alert">
                    {activeError}
                  </span>
                ) : (
                  <span id="url-helper-msg" className="input-hint">
                    Enter any public HTTP or HTTPS web address to inspect AI discoverability and speed.
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
              Read-only diagnostic
            </Badge>
            <Badge variant="neutral" showDot>
              Core Web Vitals lab
            </Badge>
            <Badge variant="neutral" showDot>
              Privacy-first tracking
            </Badge>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section style={{ padding: '0 0 var(--space-12)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-10)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: '0 0 var(--space-2) 0', color: 'var(--color-forest)' }}>
              1. AI Discoverability
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
              Verify whether GPTBot, ClaudeBot, and PerplexityBot are permitted in robots.txt, and inspect Schema.org entity structured data.
            </p>
          </div>

          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: '0 0 var(--space-2) 0', color: 'var(--color-forest)' }}>
              2. Performance Lab
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
              Measure Core Web Vitals (LCP, INP, CLS) and detect oversized images that slow down mobile and desktop visitor experiences.
            </p>
          </div>

          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: '0 0 var(--space-2) 0', color: 'var(--color-forest)' }}>
              3. Visitor Intelligence
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
              Install an ultra-lightweight (&lt; 4KB) privacy-first script to measure traffic acquisition, country distribution, and scroll depth.
            </p>
          </div>

          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: '0 0 var(--space-2) 0', color: 'var(--color-forest)' }}>
              4. Continuous Monitoring
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
              Schedule automated periodic audits, benchmark against competitors, and receive instant alerts for technical regressions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
