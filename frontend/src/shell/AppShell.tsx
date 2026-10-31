import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Modal } from '../design-system/Modal';
import { ActiveView, User, Website } from '../types/audit';

export interface AppShellProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onNewAudit: () => void;
  onLoadSample: () => void;
  findingsCount?: number;
  unreadAlertsCount?: number;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  websites?: Website[];
  activeWebsite?: Website | null;
  onSelectWebsite?: (site: Website) => void;
  isAuditInProgress?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  onNewAudit,
  onLoadSample,
  findingsCount = 0,
  unreadAlertsCount = 0,
  currentUser,
  onOpenAuth,
  websites = [],
  activeWebsite,
  onSelectWebsite,
  isAuditInProgress = false,
  children,
}) => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const isLanding = currentView === 'landing';

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header shown across application */}
      <Header
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onLoadSample={onLoadSample}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        websites={websites}
        activeWebsite={activeWebsite}
        onSelectWebsite={onSelectWebsite}
      />

      <div className="app-container" style={{ flex: 1 }}>
        {/* Sidebar shown when inside the audit app (not on landing) */}
        {!isLanding && (
          <Sidebar
            currentView={currentView}
            onNavigate={onNavigate}
            onNewAudit={onNewAudit}
            findingsCount={findingsCount}
            unreadAlertsCount={unreadAlertsCount}
            isAuditInProgress={isAuditInProgress}
          />
        )}

        <main className="app-main" role="main">
          <div className="app-content">
            {children}
          </div>
        </main>
      </div>

      <Footer
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* About Modal */}
      <Modal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        title="About Canopy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>
            <strong>Canopy</strong> is a unified website intelligence and automated diagnostic platform evaluating AI discoverability, performance, visitor behavior, and continuous technical health.
          </p>
          <p>
            While legacy SEO focuses on keywords and backlinks, modern AI search engines (such as Perplexity, Google AI Overviews, and ChatGPT Search) rely heavily on <em>machine extractability</em>: explicit HTML text, Schema.org JSON-LD entities, heading hierarchies, client-side rendering parity, and clear navigation context.
          </p>
          <p>
            <strong>Core Tenets:</strong>
          </p>
          <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <li><strong>Strictly Read-Only:</strong> We never submit forms, enter user credentials, or modify website state.</li>
            <li><strong>Zero Data Fabrication:</strong> Real lab and field measurements without synthetic score inflation.</li>
            <li><strong>Privacy-Conscious Geolocation:</strong> Raw IP addresses are discarded immediately upon country derivation.</li>
          </ul>
        </div>
      </Modal>

      {/* How It Works Modal */}
      <Modal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        title="How Canopy Works"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>
            Canopy operates four specialist evaluation engines:
          </p>
          <ol style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <li>
              <strong>AI Readiness Engine:</strong> Inspects robots.txt policies for major AI bots (GPTBot, ClaudeBot, etc.), extracts Schema.org JSON-LD graph entities, and measures machine-readable text density.
            </li>
            <li>
              <strong>Performance Lab:</strong> Evaluates Core Web Vitals (LCP, INP, CLS, FCP, TTFB) in throttled lab conditions and audits every discoverable image asset for resizing and WebP/AVIF format savings.
            </li>
            <li>
              <strong>Visitor Intelligence:</strong> An ultra-lightweight (&lt; 4KB) privacy-first tracking SDK measuring real visitor engagement, scroll depth milestones, traffic acquisition channels, and CTA conversions.
            </li>
            <li>
              <strong>Continuous Monitoring:</strong> Compares audit runs over time, identifies resolved findings vs new regressions, and detects availability anomalies.
            </li>
          </ol>
        </div>
      </Modal>

      {/* Terms Modal */}
      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Terms of Service"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>
            Canopy provides read-only diagnostic website intelligence. You agree only to audit websites that you own or have permission to inspect.
          </p>
        </div>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="Privacy Policy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>
            Canopy Analytics respects visitor privacy: no keystroke tracking, no form scraping, and no raw IP retention. Geolocation is derived in-memory and raw IP addresses are discarded immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
};
