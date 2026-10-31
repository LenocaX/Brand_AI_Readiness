import React, { useState, useEffect } from 'react';
import { Badge } from '../design-system/Badge';
import { Table, TableHeader, TableRow, TableCell } from '../design-system/Table';
import { Button } from '../design-system/Button';
import { AICrawlersInspectResponse } from '../types/audit';
import { inspectAICrawlers } from '../api/client';

interface AICrawlersSectionProps {
  url: string;
}

export const AICrawlersSection: React.FC<AICrawlersSectionProps> = ({ url }) => {
  const [data, setData] = useState<AICrawlersInspectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (url) {
      setLoading(true);
      inspectAICrawlers(url)
        .then(setData)
        .catch((err) => console.warn('Could not inspect AI crawlers:', err))
        .finally(() => setLoading(false));
    }
  }, [url]);

  if (!url) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-8)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-forest)' }}>
            AI SEARCH & DISCOVERABILITY
          </span>
          <h3 className="font-serif" style={{ fontSize: 'var(--text-lg)', margin: 'var(--space-1) 0 var(--space-1) 0' }}>
            AI Crawler Accessibility & Robots Directives
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: 0 }}>
            Analysis of <code>robots.txt</code> access permissions across the primary LLM training and search indexing bots.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)}>
            {showRaw ? 'Hide Raw Rules' : 'Inspect Raw robots.txt'}
          </Button>
        </div>
      </div>

      {loading && !data && (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-charcoal-muted)', fontSize: 'var(--text-xs)' }}>
          Inspecting robots.txt access rules for AI crawlers...
        </div>
      )}

      {showRaw && data && (
        <pre
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-ivory-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-2xs)',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            marginBottom: 'var(--space-4)',
          }}
        >
          {data.raw_robots_preview}
        </pre>
      )}

      {data && (
        <>
          <Table>
            <thead>
              <tr>
                <TableHeader>AI Crawler</TableHeader>
                <TableHeader>Provider</TableHeader>
                <TableHeader>Function</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Evidence / Directives</TableHeader>
              </tr>
            </thead>
            <tbody>
              {data.crawlers.map((bot) => (
                <TableRow key={bot.name}>
                  <TableCell>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                      {bot.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 'var(--text-xs)' }}>{bot.owner}</span>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>{bot.purpose}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={bot.status === 'allowed' ? 'success' : bot.status === 'disallowed' ? 'critical' : 'medium'}>
                      {bot.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                      {bot.evidence}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>

          <div
            style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-ivory-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-2xs)',
              color: 'var(--color-charcoal-muted)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            <strong>Note on AI Indexing:</strong> Permitting an AI crawler in robots.txt grants access to retrieve public HTML; it does not guarantee inclusion or direct attribution in LLM synthesized answers. Citation frequency is determined by factual consistency, structured data depth, and authoritative citations.
          </div>
        </>
      )}
    </div>
  );
};
