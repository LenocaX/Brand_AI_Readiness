import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Modal } from '../design-system/Modal';
import { ActiveView } from '../types/audit';

export interface AppShellProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onNewAudit: () => void;
  onLoadSample: () => void;
  findingsCount?: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  onNewAudit,
  onLoadSample,
  findingsCount = 0,
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
      />

      <div className="app-container" style={{ flex: 1 }}>
        {/* Sidebar shown when inside the audit app (not on landing) */}
        {!isLanding && (
          <Sidebar
            currentView={currentView}
            onNavigate={onNavigate}
            onNewAudit={onNewAudit}
            findingsCount={findingsCount}
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
            <strong>Canopy</strong> is an automated diagnostic platform that evaluates how artificial intelligence agents, LLM search engines (such as Perplexity, Google AI Overviews, and Bing Copilot), and automated retrieval systems interpret public website content.
          </p>
          <p>
            While legacy SEO focuses on keywords and backlinks, modern AI crawlers rely heavily on <em>machine extractability</em>: explicit HTML text, Schema.org JSON-LD entities, heading hierarchies, client-side rendering parity, and clear navigation context.
          </p>
          <p>
            <strong>Core Tenets:</strong>
          </p>
          <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <li><strong>Strictly Read-Only:</strong> We never submit forms, enter user credentials, or modify website state.</li>
            <li><strong>Evidence-Backed Findings:</strong> Every reported finding contains observable DOM or HTTP evidence.</li>
            <li><strong>Predictable Scoring:</strong> Transparent deductive scoring model starting from 100 with bounded penalties.</li>
          </ul>
        </div>
      </Modal>

      {/* How It Works Modal */}
      <Modal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        title="How the Audit Engine Works"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>
            The audit runs as a multi-stage sequential pipeline orchestrated by Python specialist skills:
          </p>
          <ol style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <li>
              <strong>1. Crawl & Render Audit:</strong> Fetches pages, examines HTTP headers, evaluates title and meta tags, and compares raw HTML with browser-rendered DOM.
            </li>
            <li>
              <strong>2. Structured Data Audit:</strong> Parses and validates Schema.org JSON-LD scripts to verify entity relationships and machine-readable properties.
            </li>
            <li>
              <strong>3. Content Extractability Audit:</strong> Measures text density, checks image alt text completeness, and detects informative content trapped in non-text elements.
            </li>
            <li>
              <strong>4. Freshness & Proof Audit:</strong> Checks copyright currency, date markers, and corroborating signals for factual assertions.
            </li>
            <li>
              <strong>5. Engagement Audit:</strong> Evaluates H1 heading presence, primary navigation clarity, contextual retention, and flags dead-end states.
            </li>
            <li>
              <strong>6. Audit Orchestrator:</strong> Deduplicates overlapping findings, computes final readiness and engagement scores, builds a prioritized action plan, and validates against the report schema.
            </li>
          </ol>
        </div>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        title="Terms of Service"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>
            <strong>1. Read-Only Verification:</strong> The Brand AI-Readiness Audit platform operates strictly as a read-only testing tool. It crawls publicly accessible HTML and evaluates discoverability, metadata, structured data, extractability, and orientation.
          </p>
          <p>
            <strong>2. Authorized Use:</strong> By submitting a URL for auditing, you confirm that you are authorized to request public accessibility analysis of the designated web domain.
          </p>
          <p>
            <strong>3. No Form Submission:</strong> The audit engine will not submit forms, execute destructive mutations, or attempt authentication bypass.
          </p>
          <p>
            <strong>4. Limitation of Scope:</strong> Audit scores reflect automated rule evaluations and do not guarantee indexing or inclusion by third-party search engines or AI systems.
          </p>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="Privacy Policy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p>
            <strong>1. Information Analyzed:</strong> The platform retrieves publicly accessible web content delivered by the target URL. No private user credentials, session cookies, or backend server infrastructure are accessed.
          </p>
          <p>
            <strong>2. Data Retention:</strong> Audit reports generated during your session are stored locally for verification and report export. No personal identifiable information is harvested or sold.
          </p>
          <p>
            <strong>3. Security:</strong> All crawl interactions respect standard HTTP timeout limits, robots.txt directives where configured, and security boundaries.
          </p>
        </div>
      </Modal>
    </div>
  );
};
