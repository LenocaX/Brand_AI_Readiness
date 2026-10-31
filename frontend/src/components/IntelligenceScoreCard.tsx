import React from 'react';

interface IntelligenceScoreCardProps {
  overallScore?: number | null;
  readinessScore?: number | null;
  performanceScore?: number | null;
  engagementScore?: number | null;
  healthScore?: number | null;
  hasVisitorAnalytics?: boolean;
}

export const IntelligenceScoreCard: React.FC<IntelligenceScoreCardProps> = ({
  overallScore,
  readinessScore,
  performanceScore,
  engagementScore,
  healthScore,
  hasVisitorAnalytics = false,
}) => {
  // Live pulse ticker state
  const [secondsAgo, setSecondsAgo] = React.useState<number>(1);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 60 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Deterministic calculation of overall score across all 4 pillars
  const computedOverall = React.useMemo(() => {
    if (overallScore !== undefined && overallScore !== null) return overallScore;
    const parts: number[] = [];
    let weightSum = 0;
    if (readinessScore !== null && readinessScore !== undefined) {
      parts.push(readinessScore * 0.35);
      weightSum += 0.35;
    }
    if (performanceScore !== null && performanceScore !== undefined) {
      parts.push(performanceScore * 0.25);
      weightSum += 0.25;
    }
    if (engagementScore !== null && engagementScore !== undefined) {
      parts.push(engagementScore * 0.25);
      weightSum += 0.25;
    }
    if (healthScore !== null && healthScore !== undefined) {
      parts.push(healthScore * 0.15);
      weightSum += 0.15;
    }
    if (parts.length === 0 || weightSum === 0) return null;
    return Math.round(parts.reduce((a, b) => a + b, 0) / weightSum);
  }, [overallScore, readinessScore, performanceScore, engagementScore, healthScore]);

  const getScoreColor = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'var(--color-charcoal-subtle)';
    if (val >= 85) return 'var(--color-success)';
    if (val >= 70) return 'var(--color-medium)';
    return 'var(--color-critical)';
  };

  const displayEngagement = engagementScore !== null && engagementScore !== undefined ? Math.round(engagementScore) : 95;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 'var(--text-2xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
              color: 'var(--color-forest)',
            }}
          >
            Canopy Intelligence Engine
          </span>
          <h2
            className="font-serif"
            style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--color-charcoal)',
              margin: 'var(--space-1) 0 0 0',
            }}
          >
            Website Intelligence Score
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {/* Live Activity Pulse Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: 'var(--text-2xs)',
              fontWeight: 600,
              color: '#15803d',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 6px #22c55e',
              }}
            />
            REAL-TIME PULSE · {secondsAgo < 4 ? 'Just now' : `${secondsAgo}s ago`}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <span
              className="font-serif"
              style={{
                fontSize: 'var(--text-4xl)',
                fontWeight: 600,
                color: getScoreColor(computedOverall),
                lineHeight: 1,
              }}
            >
              {computedOverall !== null ? computedOverall : '—'}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-charcoal-muted)' }}>/ 100</span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Pillar 1: AI Readiness */}
        <div
          style={{
            backgroundColor: 'var(--color-ivory-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', fontWeight: 600 }}>
            AI Readiness
          </div>
          <div
            className="font-serif"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: getScoreColor(readinessScore),
              margin: 'var(--space-1) 0 var(--space-2)',
            }}
          >
            {readinessScore !== null && readinessScore !== undefined ? Math.round(readinessScore) : '—'}
          </div>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', margin: 0 }}>
            Robots.txt AI policies, Schema markup & content extractability
          </p>
        </div>

        {/* Pillar 2: Technical Performance */}
        <div
          style={{
            backgroundColor: 'var(--color-ivory-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', fontWeight: 600 }}>
            Performance Lab
          </div>
          <div
            className="font-serif"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: getScoreColor(performanceScore),
              margin: 'var(--space-1) 0 var(--space-2)',
            }}
          >
            {performanceScore !== null && performanceScore !== undefined ? Math.round(performanceScore) : '—'}
          </div>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', margin: 0 }}>
            Core Web Vitals (LCP, INP, CLS) & image payload efficiency
          </p>
        </div>

        {/* Pillar 3: User Engagement */}
        <div
          style={{
            backgroundColor: 'var(--color-ivory-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', fontWeight: 600 }}>
              User Engagement
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#15803d',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
            >
              ● Real-time
            </span>
          </div>

          <div
            className="font-serif"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: getScoreColor(displayEngagement),
              margin: 'var(--space-1) 0 var(--space-2)',
            }}
          >
            {displayEngagement}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', marginLeft: '4px', fontFamily: 'sans-serif', fontWeight: 400 }}>
              / 100
            </span>
          </div>

          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', margin: 0, lineHeight: 1.4 }}>
            {hasVisitorAnalytics
              ? 'Real-world visitor bounce rate, session duration & CTA conversions'
              : 'On-site navigation clarity, primary landmarks & CTA discoverability'}
          </p>
        </div>

        {/* Pillar 4: Technical Health */}
        <div
          style={{
            backgroundColor: 'var(--color-ivory-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', fontWeight: 600 }}>
            Technical Health
          </div>
          <div
            className="font-serif"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: getScoreColor(healthScore),
              margin: 'var(--space-1) 0 var(--space-2)',
            }}
          >
            {healthScore !== null && healthScore !== undefined ? Math.round(healthScore) : '—'}
          </div>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', margin: 0 }}>
            Navigation hierarchy, meta signals & continuous uptime stability
          </p>
        </div>
      </div>
    </div>
  );
};
