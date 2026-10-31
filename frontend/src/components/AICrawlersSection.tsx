import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableCell } from '../design-system/Table';
import { Button } from '../design-system/Button';
import { AICrawlersInspectResponse, AICrawlerItem } from '../types/audit';
import { inspectAICrawlers } from '../api/client';

interface AICrawlersSectionProps {
  url: string;
}

const BOT_DESCRIPTIONS: Record<string, string> = {
  'GPTBot': 'Powers ChatGPT knowledge retrieval and OpenAI model training',
  'OAI-SearchBot': 'Powers real-time search queries and citations in ChatGPT Search',
  'ClaudeBot': 'Powers Claude AI assistant answers and web citations',
  'PerplexityBot': 'Powers Perplexity AI search engine sources and answer citations',
  'Google-Extended': 'Controls Google Gemini and Vertex AI training access',
  'Bytespider': 'Powers ByteDance and TikTok AI search and assistant training',
};

function formatAccessExplanation(bot: AICrawlerItem): { heading: string; detail: string; isAllowed: boolean } {
  if (bot.status === 'disallowed') {
    return {
      heading: 'Blocked from Crawling',
      detail: bot.evidence || 'Explicitly blocked in robots.txt. This AI bot cannot read or cite your pages in its answers.',
      isAllowed: false,
    };
  }

  if (bot.status === 'allowed') {
    return {
      heading: 'Allowed to Crawl',
      detail: 'Explicitly permitted in robots.txt. This AI bot can freely discover, index, and cite your pages.',
      isAllowed: true,
    };
  }

  // status === 'unspecified' (implicitly permitted)
  return {
    heading: 'Allowed by Default',
    detail: 'No blocking rules detected. This AI bot can read your public pages and reference your brand in search responses.',
    isAllowed: true,
  };
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
            AI Crawler Accessibility & Search Permissions
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: 0 }}>
            Inspect which AI search engines and assistants (like ChatGPT, Claude, and Perplexity) are permitted to discover, read, and cite your website.
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
          {/* Executive Summary Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: data.disallowed_count === 0 ? 'var(--color-success-bg)' : 'var(--color-critical-bg)',
              border: `1px solid ${data.disallowed_count === 0 ? 'var(--color-success-border)' : 'var(--color-critical-border)'}`,
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              {data.disallowed_count === 0 ? '✅' : '⚠️'}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: data.disallowed_count === 0 ? 'var(--color-success)' : 'var(--color-critical)' }}>
                {data.disallowed_count === 0
                  ? 'All major AI search crawlers can access your website'
                  : `${data.disallowed_count} of ${data.total_crawlers_evaluated} AI crawlers are blocked from reading your website`}
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>
                {data.disallowed_count === 0
                  ? 'Assistants like ChatGPT, Claude, and Perplexity can access your public pages to gather facts, summarize information, and cite your brand in answers.'
                  : 'Blocked crawlers cannot access your content or link to your website when answering user inquiries.'}
              </div>
            </div>
          </div>

          <Table>
            <thead>
              <tr>
                <TableHeader>AI Crawler</TableHeader>
                <TableHeader>Provider</TableHeader>
                <TableHeader>What It Does</TableHeader>
                <TableHeader>Access & Impact on AI Search</TableHeader>
              </tr>
            </thead>
            <tbody>
              {data.crawlers.map((bot) => {
                const access = formatAccessExplanation(bot);
                return (
                  <TableRow key={bot.name}>
                    <TableCell>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', display: 'block' }}>
                        {bot.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>{bot.owner}</span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                        {BOT_DESCRIPTIONS[bot.name] || bot.purpose}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--text-2xs)',
                            fontWeight: 600,
                            color: access.isAllowed ? 'var(--color-success)' : 'var(--color-critical)',
                            marginBottom: '2px',
                          }}
                        >
                          <span>{access.isAllowed ? '●' : '■'}</span>
                          <span>{access.heading}</span>
                        </span>
                        <p style={{ margin: 0, fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', lineHeight: '1.4' }}>
                          {access.detail}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>

          <div
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-ivory-light)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-2xs)',
              color: 'var(--color-charcoal-muted)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            <strong style={{ color: 'var(--color-charcoal)', display: 'block', marginBottom: 'var(--space-1)' }}>
              💡 Why AI Crawler Permissions Matter:
            </strong>
            <span>
              Allowing AI crawlers gives search engines like ChatGPT Search and Perplexity permission to crawl your site and provide direct source links to your pages. To maximize citation frequency, complement crawler access with high information density, clear headings (H1–H3), and structured Schema.org data.
            </span>
          </div>
        </>
      )}
    </div>
  );
};
