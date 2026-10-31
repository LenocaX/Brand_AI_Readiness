import React, { useState, useEffect } from 'react';
import { PageHeading } from '../design-system/PageHeading';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Table, TableHeader, TableRow, TableCell } from '../design-system/Table';
import { PerformanceData } from '../types/audit';
import { getWebsitePerformance, runWebsitePerformance, getStandalonePerformance } from '../api/client';

interface PerformanceViewProps {
  websiteId?: string | null;
  targetUrl?: string;
  onNavigateToOverview?: () => void;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  websiteId,
  targetUrl,
  onNavigateToOverview,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oversizedOnly, setOversizedOnly] = useState(false);
  const [imageSearch, setImageSearch] = useState('');

  const fetchPerformance = async (runFresh: boolean = false) => {
    setLoading(true);
    setError(null);

    let cleanTarget = targetUrl || 'https://jiit.ac.in';
    if (!cleanTarget.startsWith('http://') && !cleanTarget.startsWith('https://')) {
      cleanTarget = `https://${cleanTarget}`;
    }

    try {
      if (websiteId) {
        try {
          if (runFresh) {
            const res = await runWebsitePerformance(websiteId, device);
            setData(res);
            return;
          } else {
            const res = await getWebsitePerformance(websiteId, device);
            setData(res);
            return;
          }
        } catch {
          // Fallback to standalone laboratory test if websiteId lookup had an issue
          const res = await getStandalonePerformance(cleanTarget, device);
          setData(res);
          return;
        }
      } else {
        const res = await getStandalonePerformance(cleanTarget, device);
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (websiteId || targetUrl) {
      fetchPerformance(false);
    }
  }, [websiteId, targetUrl, device]);

  const filteredImages = React.useMemo(() => {
    if (!data?.images) return [];
    return data.images.filter((img) => {
      if (oversizedOnly && !img.is_oversized) return false;
      if (imageSearch && !img.image_url.toLowerCase().includes(imageSearch.toLowerCase())) return false;
      return true;
    });
  }, [data?.images, oversizedOnly, imageSearch]);

  const getMetricBadge = (status: 'good' | 'needs_improvement' | 'poor') => {
    if (status === 'good') return <Badge variant="success">Good</Badge>;
    if (status === 'needs_improvement') return <Badge variant="medium">Needs Improvement</Badge>;
    return <Badge variant="critical">Poor</Badge>;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <PageHeading
          eyebrow="PERFORMANCE INTELLIGENCE"
          title="Core Web Vitals & Image Asset Lab"
          subtitle={
            websiteId
              ? 'Controlled laboratory performance audit assessing Core Web Vitals, image decoding, and resource payloads.'
              : `Performance measurements for ${targetUrl || 'target website'}`
          }
        />

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {/* Device Toggle */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--color-ivory-light)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              style={{
                padding: '4px 12px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: device === 'desktop' ? 'var(--color-forest)' : 'transparent',
                color: device === 'desktop' ? 'var(--color-ivory)' : 'var(--color-charcoal-muted)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              style={{
                padding: '4px 12px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: device === 'mobile' ? 'var(--color-forest)' : 'transparent',
                color: device === 'mobile' ? 'var(--color-ivory)' : 'var(--color-charcoal-muted)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Mobile
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={() => fetchPerformance(true)} disabled={loading}>
            {loading ? 'Auditing...' : 'Run Performance Audit'}
          </Button>

          {onNavigateToOverview && (
            <Button variant="outline" size="sm" onClick={onNavigateToOverview}>
              Back to Overview
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-critical-bg)',
            border: '1px solid var(--color-critical-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-critical)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {error}
        </div>
      )}

      {loading && !data && (
        <div
          style={{
            padding: 'var(--space-12)',
            backgroundColor: 'var(--color-surface-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
            color: 'var(--color-charcoal-muted)',
          }}
        >
          Analyzing DOM elements, inspecting image payloads and measuring Core Web Vitals...
        </div>
      )}

      {data && (
        <>
          {/* Notice banner distinguishing lab from field metrics */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-ivory-light)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-charcoal-muted)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              <strong>Laboratory Audit:</strong> Measurements collected under documented throttled network conditions ({device}). Real-user field data is available in the Visitor Analytics module.
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-forest)' }}>
              Score: {data.performance_score}/100
            </span>
          </div>

          {/* Core Web Vitals Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {/* LCP */}
            <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)' }}>LCP</span>
                {getMetricBadge(data.thresholds.lcp_status)}
              </div>
              <div className="font-serif" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, margin: 'var(--space-2) 0' }}>
                {data.metrics.lcp}s
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                Largest Contentful Paint (Target: &le; 2.5s)
              </div>
            </div>

            {/* INP */}
            <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)' }}>INP</span>
                {getMetricBadge(data.thresholds.inp_status)}
              </div>
              <div className="font-serif" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, margin: 'var(--space-2) 0' }}>
                {data.metrics.inp}ms
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                Interaction to Next Paint (Target: &le; 200ms)
              </div>
            </div>

            {/* CLS */}
            <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)' }}>CLS</span>
                {getMetricBadge(data.thresholds.cls_status)}
              </div>
              <div className="font-serif" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, margin: 'var(--space-2) 0' }}>
                {data.metrics.cls}
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                Cumulative Layout Shift (Target: &le; 0.1)
              </div>
            </div>

            {/* FCP */}
            <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)' }}>FCP</span>
                {getMetricBadge(data.thresholds.fcp_status)}
              </div>
              <div className="font-serif" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, margin: 'var(--space-2) 0' }}>
                {data.metrics.fcp}s
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                First Contentful Paint (Target: &le; 1.8s)
              </div>
            </div>

            {/* TTFB */}
            <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)' }}>TTFB</span>
                {getMetricBadge(data.thresholds.ttfb_status)}
              </div>
              <div className="font-serif" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, margin: 'var(--space-2) 0' }}>
                {data.metrics.ttfb}s
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                Time to First Byte (Target: &le; 0.8s)
              </div>
            </div>
          </div>

          {/* Image Asset Intelligence Dashboard */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-forest)' }}>
                  ASSET OPTIMIZATION
                </span>
                <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', margin: 'var(--space-1) 0 0 0' }}>
                  Image Loading & Compression Intelligence
                </h3>
              </div>

              {/* Summary Badges */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-ivory-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}>
                  Total Images: <strong>{data.images_summary.total_images}</strong>
                </div>
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-ivory-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}>
                  Payload: <strong>{Math.round(data.images_summary.total_image_bytes / 1024)} KB</strong>
                </div>
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-critical-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-critical-border)', fontSize: 'var(--text-xs)', color: 'var(--color-critical)' }}>
                  Oversized: <strong>{data.images_summary.oversized_images}</strong>
                </div>
                {data.images_summary.potential_savings_bytes > 0 && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-success-border)', fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
                    Est. Savings: <strong>{Math.round(data.images_summary.potential_savings_bytes / 1024)} KB</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Filter image URL..."
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  width: '240px',
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={oversizedOnly}
                  onChange={(e) => setOversizedOnly(e.target.checked)}
                />
                Show oversized images only
              </label>
            </div>

            {/* Images Table */}
            <Table>
              <thead>
                <tr>
                  <TableHeader>Asset / URL</TableHeader>
                  <TableHeader>Format</TableHeader>
                  <TableHeader align="right">Transfer Size</TableHeader>
                  <TableHeader align="right">Dimensions (Nat vs Disp)</TableHeader>
                  <TableHeader>Lazy Loading</TableHeader>
                  <TableHeader align="right">Est. Opportunity</TableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredImages.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-charcoal-muted)' }}>
                      No image assets match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredImages.map((img, idx) => {
                    const filename = img.image_url.split('/').pop()?.split('?')[0] || img.image_url;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '380px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {filename}
                              </span>
                              {img.is_lcp_candidate && (
                                <span style={{ fontSize: 'var(--text-2xs)', padding: '1px 4px', backgroundColor: 'var(--color-critical-bg)', color: 'var(--color-critical)', borderRadius: '2px', fontWeight: 600 }}>
                                  LCP Element
                                </span>
                              )}
                              {img.is_cdn && (
                                <span style={{ fontSize: 'var(--text-2xs)', padding: '1px 4px', backgroundColor: 'var(--color-sage-light)', color: 'var(--color-forest)', borderRadius: '2px' }}>
                                  CDN
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {img.image_url}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={img.format === 'WEBP' || img.format === 'AVIF' || img.format === 'SVG' ? 'success' : 'medium'}>
                            {img.format}
                          </Badge>
                        </TableCell>
                        <TableCell align="right">
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: img.file_size_bytes > 200_000 ? 700 : 400, color: img.file_size_bytes > 200_000 ? 'var(--color-critical)' : 'inherit' }}>
                            {Math.round(img.file_size_bytes / 1024)} KB
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          <div style={{ fontSize: 'var(--text-xs)' }}>
                            <span>{img.natural_width} &times; {img.natural_height}</span>
                            <span style={{ color: 'var(--color-charcoal-muted)', margin: '0 4px' }}>/</span>
                            <span style={{ color: img.is_oversized ? 'var(--color-critical)' : 'inherit' }}>
                              {img.displayed_width} &times; {img.displayed_height}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {img.is_lazy_loaded ? (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>loading="lazy"</span>
                          ) : (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)' }}>Eager</span>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {img.potential_savings_bytes > 0 ? (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 600 }}>
                              -{Math.round(img.potential_savings_bytes / 1024)} KB
                            </span>
                          ) : (
                            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>Optimal</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          {/* Performance Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-6)' }}>
              <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', margin: '0 0 var(--space-4) 0' }}>
                Targeted Performance Action Items
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--color-ivory-light)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-charcoal)' }}>
                        {rec.title}
                      </span>
                      <Badge variant={rec.impact === 'critical' ? 'critical' : rec.impact === 'high' ? 'high' : 'medium'}>
                        {rec.impact} impact
                      </Badge>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: '0 0 var(--space-2) 0' }}>
                      {rec.action}
                    </p>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-forest)', fontWeight: 600 }}>
                      Measurable benefit: {rec.opportunity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
