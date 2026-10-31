import { useState, useMemo, useEffect } from 'react';
import { AppShell } from './shell/AppShell';
import { LandingPage } from './views/LandingPage';
import { AuditInProgressView } from './views/AuditInProgressView';
import { ReportOverviewView } from './views/ReportOverviewView';
import { FindingsView } from './views/FindingsView';
import { FindingDetailView } from './views/FindingDetailView';
import { RecommendationsView } from './views/RecommendationsView';
import { PerformanceView } from './views/PerformanceView';
import { AnalyticsView } from './views/AnalyticsView';
import { HistoryComparisonView } from './views/HistoryComparisonView';
import { SettingsView } from './views/SettingsView';
import { AuthModal } from './views/AuthModal';
import { IntelligenceScoreCard } from './components/IntelligenceScoreCard';
import { AICrawlersSection } from './components/AICrawlersSection';

import { ActiveView, AuditReport, Finding, User, Website } from './types/audit';
import { sampleReport } from './mock/sampleReport';
import {
  createAuditJob,
  getSampleReport,
  getJobStatus,
  getCurrentUser,
  logoutUser,
  getWebsites,
  createWebsite,
  getWebsiteAuditHistory,
  getWebsiteAlerts,
  AuditApiError,
} from './api/client';
import { PageHeading } from './design-system/PageHeading';
import { Button } from './design-system/Button';

const AuditInProgressPlaceholder: React.FC<{
  targetUrl: string;
  onViewProgress: () => void;
  sectionName: string;
}> = ({ targetUrl, onViewProgress, sectionName }) => (
  <div style={{ maxWidth: '680px', margin: 'var(--space-10) auto', padding: '0 var(--space-4)' }}>
    <div
      style={{
        backgroundColor: 'var(--color-surface-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-10) var(--space-8)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          backgroundColor: 'rgba(255, 193, 7, 0.12)',
          border: '1px solid rgba(255, 193, 7, 0.35)',
          borderRadius: 'var(--radius-pill)',
          color: 'var(--color-forest)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          marginBottom: 'var(--space-3)',
        }}
      >
        <span>⏳</span>
        <span>Audit in Progress</span>
      </div>
      <h2
        className="font-serif"
        style={{
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-charcoal)',
          fontWeight: 500,
          marginBottom: 'var(--space-2)',
        }}
      >
        {sectionName} Pending
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-charcoal-muted)',
          maxWidth: '520px',
          margin: '0 auto var(--space-6)',
          lineHeight: 'var(--leading-relaxed)',
        }}
      >
        A live audit is currently in progress for <strong>{targetUrl || 'your website'}</strong>. Previous results have been cleared to guarantee strict data accuracy. Results for this section will appear here automatically once the audit finishes successfully.
      </p>
      <Button variant="primary" onClick={onViewProgress}>
        View Live Progress Tracker &rarr;
      </Button>
    </div>
  </div>
);

const NoAuditCompletedPlaceholder: React.FC<{
  onStartAudit: () => void;
  onLoadSample: () => void;
  sectionName: string;
}> = ({ onStartAudit, onLoadSample, sectionName }) => (
  <div style={{ maxWidth: '680px', margin: 'var(--space-10) auto', padding: '0 var(--space-4)' }}>
    <div
      style={{
        backgroundColor: 'var(--color-surface-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-10) var(--space-8)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--color-charcoal-muted)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Audit Required
      </div>
      <h2
        className="font-serif"
        style={{
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-charcoal)',
          fontWeight: 500,
          marginBottom: 'var(--space-2)',
        }}
      >
        {sectionName}
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-charcoal-muted)',
          maxWidth: '500px',
          margin: '0 auto var(--space-6)',
          lineHeight: 'var(--leading-relaxed)',
        }}
      >
        This section is empty because no audit has been run yet. Run a live audit on your website to populate intelligence scores, findings, and recommendations, or explore a demonstration report.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={onStartAudit}>
          Start Website Audit
        </Button>
        <Button variant="secondary" onClick={onLoadSample}>
          Explore Demonstration Report
        </Button>
      </div>
    </div>
  </div>
);

const getInitialView = (): ActiveView => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    const validViews: ActiveView[] = [
      'landing', 'in_progress', 'overview', 'ai_readiness',
      'performance', 'analytics', 'history_comparison',
      'findings', 'finding_detail', 'recommendations', 'settings'
    ];
    if (v && validViews.includes(v as ActiveView)) {
      return v as ActiveView;
    }
  }
  return 'landing';
};

export function App() {
  const [currentView, setCurrentView] = useState<ActiveView>(getInitialView);
  const [activeUrl, setActiveUrl] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<AuditReport | null>(null);
  const [isSampleReport, setIsSampleReport] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>(undefined);

  // SaaS User & Multi-website state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [activeWebsite, setActiveWebsite] = useState<Website | null>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Findings exploration state
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFindingId, setCurrentFindingId] = useState<string | null>(null);

  const isAuditInProgress = Boolean(activeJobId && !activeReport);

  // Load session & websites on mount ONLY if authenticated
  const refreshWebsites = async () => {
    if (!currentUser) {
      setWebsites([]);
      setActiveWebsite(null);
      return;
    }
    try {
      const sites = await getWebsites();
      setWebsites(sites);
      if (sites.length > 0 && !activeWebsite) {
        setActiveWebsite(sites[0]);
      }
    } catch {
      // Ignored if not yet initialized
    }
  };

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        if (user) {
          getWebsites()
            .then((sites) => {
              setWebsites(sites);
              if (sites.length > 0) setActiveWebsite(sites[0]);
            })
            .catch(() => {});
        } else {
          setWebsites([]);
          setActiveWebsite(null);
        }
      })
      .catch(() => {
        setCurrentUser(null);
        setWebsites([]);
        setActiveWebsite(null);
      });
  }, []);

  // Refresh alerts count when active website changes (only if authenticated)
  useEffect(() => {
    if (currentUser && activeWebsite?.id) {
      getWebsiteAlerts(activeWebsite.id, true)
        .then((alerts) => setUnreadAlertsCount(alerts.length))
        .catch(() => {});
    } else {
      setUnreadAlertsCount(0);
    }
  }, [currentUser, activeWebsite?.id]);

  // Global background polling for active audit job so navigation never drops the audit
  useEffect(() => {
    if (!activeJobId || activeReport) return;

    let isCancelled = false;
    const pollInterval = setInterval(async () => {
      try {
        const job = await getJobStatus(activeJobId);
        if (isCancelled) return;
        if (job.status === 'completed' && job.report) {
          clearInterval(pollInterval);
          handleAuditCompleted(job.report);
        } else if (job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(pollInterval);
        }
      } catch {
        // Retry silently on next cycle
      }
    }, 1500);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [activeJobId, activeReport]);

  const handleNavigate = (view: ActiveView, extraParams?: Record<string, string>) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('view', view);
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
      }
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  };

  const extractDomain = (url: string): string => {
    try {
      const u = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      const parsed = new URL(u);
      return parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  // Synchronize active website to the active report domain ONLY when user is signed in
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    if (activeReport?.site) {
      const repDomain = extractDomain(activeReport.site);
      setActiveWebsite((prev) => {
        if (prev && prev.domain.toLowerCase() === repDomain.toLowerCase()) {
          return prev;
        }
        const found = websites.find((w) => w.domain.toLowerCase() === repDomain.toLowerCase());
        if (found) {
          return found;
        }
        const syncSite: Website = {
          id: `site-${repDomain.replace(/[^a-zA-Z0-9]/g, '_')}`,
          user_id: currentUser.id,
          name: repDomain,
          domain: repDomain,
          canonical_url: activeReport.site.startsWith('http') ? activeReport.site : `https://${repDomain}`,
          category: 'Audited Site',
          verification_token: `canopy_sync_${repDomain}`,
          is_verified: true,
          verified_at: new Date().toISOString(),
          monitoring_enabled: false,
          monitoring_frequency: 'daily',
          last_audit_at: activeReport.audited_at || new Date().toISOString(),
          latest_readiness_score: activeReport.readiness?.score ?? 83,
          latest_performance_score: 88,
          latest_engagement_score: activeReport.engagement?.score ?? 98,
          latest_health_score: 89,
          created_at: new Date().toISOString(),
        };
        setWebsites((prevSites) => [syncSite, ...prevSites.filter((w) => w.domain.toLowerCase() !== repDomain.toLowerCase())]);
        return syncSite;
      });
    }
  }, [activeReport?.site, currentUser, websites]);

  const handleStartAudit = async (targetUrl: string) => {
    setIsLoading(true);
    setApiError(undefined);
    setActiveUrl(targetUrl);
    setIsSampleReport(false);

    // CRITICAL: Clear all previous audit data so that nothing from previous runs is displayed
    setActiveReport(null);
    setCurrentFindingId(null);
    setActiveJobId(null);

    const targetDomain = extractDomain(targetUrl);

    // If authenticated, sync website record
    let siteIdToUse: string | undefined = undefined;
    if (currentUser) {
      const matchedSite = websites.find(
        (w) => w.domain.toLowerCase() === targetDomain || targetDomain.includes(w.domain.toLowerCase())
      );
      if (matchedSite) {
        setActiveWebsite(matchedSite);
        siteIdToUse = matchedSite.id;
      } else {
        createWebsite(targetUrl, targetDomain, 'Audited Site')
          .then((saved) => {
            setWebsites((prev) => [saved, ...prev.filter((w) => w.domain !== targetDomain)]);
            setActiveWebsite(saved);
          })
          .catch(() => {});
      }
    } else {
      setActiveWebsite(null);
    }

    try {
      const job = await createAuditJob(targetUrl, siteIdToUse);
      setActiveJobId(job.job_id);
      handleNavigate('in_progress', { job_id: job.job_id });
    } catch (err: unknown) {
      if (err instanceof AuditApiError) {
        setApiError(err.message);
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred while initiating the audit.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setActiveJobId(null);
    try {
      const sample = await getSampleReport();
      setActiveReport(sample);
      setIsSampleReport(true);
      setActiveUrl(sample.site);

      if (currentUser) {
        const domain = extractDomain(sample.site);
        const sampleSite: Website = {
          id: 'sample-jiitshelf',
          user_id: currentUser.id,
          name: domain,
          domain: domain,
          canonical_url: sample.site.startsWith('http') ? sample.site : `https://${domain}`,
          category: 'Demonstration',
          verification_token: 'canopy_sample_token',
          is_verified: true,
          verified_at: new Date().toISOString(),
          monitoring_enabled: true,
          monitoring_frequency: 'weekly',
          last_audit_at: sample.audited_at,
          latest_readiness_score: sample.readiness?.score ?? 74,
          latest_performance_score: 88,
          latest_engagement_score: sample.engagement?.score ?? 95,
          latest_health_score: 86,
          created_at: new Date().toISOString(),
        };
        setWebsites((prev) => [sampleSite, ...prev.filter((w) => w.domain !== domain)]);
        setActiveWebsite(sampleSite);
      } else {
        setActiveWebsite(null);
      }
      handleNavigate('overview');
    } catch {
      setActiveReport(sampleReport);
      setIsSampleReport(true);
      handleNavigate('overview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditCompleted = (report: AuditReport) => {
    setActiveReport(report);
    setIsSampleReport(false);
    setActiveJobId(null);
    const domain = extractDomain(report.site);

    if (currentUser) {
      setActiveWebsite((prev) => {
        const updatedSite: Website = {
          id: prev?.domain.toLowerCase() === domain ? prev.id : `site-${domain.replace(/[^a-zA-Z0-9]/g, '_')}`,
          user_id: currentUser.id,
          name: domain,
          domain: domain,
          canonical_url: report.site.startsWith('http') ? report.site : `https://${domain}`,
          category: 'General',
          verification_token: prev?.verification_token || `canopy_verify_${Math.random().toString(36).substring(2, 10)}`,
          is_verified: true,
          verified_at: prev?.verified_at || new Date().toISOString(),
          monitoring_enabled: true,
          monitoring_frequency: 'daily',
          last_audit_at: report.audited_at || new Date().toISOString(),
          latest_readiness_score: report.readiness?.score ?? 83,
          latest_performance_score: 88,
          latest_engagement_score: report.engagement?.score ?? 98,
          latest_health_score: Math.round(((report.readiness?.score ?? 80) * 0.5) + ((report.engagement?.score ?? 95) * 0.5)),
          created_at: prev?.created_at || new Date().toISOString(),
        };
        setWebsites((currentSites) => [updatedSite, ...currentSites.filter((w) => w.domain.toLowerCase() !== domain)]);
        return updatedSite;
      });
    } else {
      setActiveWebsite(null);
    }

    handleNavigate('overview');
  };

  const handleSelectWebsite = async (site: Website) => {
    if (!currentUser) return;
    setActiveWebsite(site);
    setActiveUrl(site.canonical_url || `https://${site.domain}`);
    try {
      const history = await getWebsiteAuditHistory(site.id);
      if (history && history.length > 0) {
        const latest = history[0];
        const job = await getJobStatus(latest.id);
        if (job.report) {
          setActiveReport(job.report);
          setIsSampleReport(false);
        }
      }
    } catch {
      // Keep existing report or clean state
    }
  };

  const handleViewPreviousAudit = async (auditId: string) => {
    if (!currentUser) return;
    try {
      const job = await getJobStatus(auditId);
      if (job.report) {
        setActiveReport(job.report);
        setIsSampleReport(false);
        setActiveUrl(job.url);
        handleNavigate('overview');
      }
    } catch (err: any) {
      alert(`Could not load historical audit: ${err.message}`);
    }
  };

  const handleSelectFinding = (finding: Finding) => {
    setCurrentFindingId(finding.id);
    handleNavigate('finding_detail', { finding_id: finding.id });
  };

  const handleDownloadReport = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `canopy-audit-${activeReport.site.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setWebsites([]);
    setActiveWebsite(null);
    handleNavigate('landing');
  };

  const findingsCount = activeReport?.findings?.length ?? 0;
  const currentFinding = useMemo(() => {
    if (!activeReport || !currentFindingId) return null;
    return activeReport.findings.find((f) => f.id === currentFindingId) || null;
  }, [activeReport, currentFindingId]);

  return (
    <AppShell
      currentView={currentView}
      onNavigate={handleNavigate}
      onNewAudit={() => {
        setActiveReport(null);
        setActiveJobId(null);
        handleNavigate('landing');
      }}
      onLoadSample={handleLoadSample}
      findingsCount={findingsCount}
      unreadAlertsCount={unreadAlertsCount}
      currentUser={currentUser}
      onOpenAuth={() => setIsAuthModalOpen(true)}
      websites={currentUser ? websites : []}
      activeWebsite={currentUser ? activeWebsite : null}
      onSelectWebsite={handleSelectWebsite}
      isAuditInProgress={isAuditInProgress}
    >
      {/* 1. LANDING PAGE */}
      {currentView === 'landing' && (
        <LandingPage
          onStartAudit={handleStartAudit}
          onViewSample={handleLoadSample}
          isLoading={isLoading}
          errorMessage={apiError}
          onOpenAbout={() => {}}
          onOpenHowItWorks={() => {}}
          onViewPreviousAudit={handleViewPreviousAudit}
          currentUser={currentUser}
        />
      )}

      {/* 2. IN PROGRESS VIEW */}
      {currentView === 'in_progress' && (
        activeJobId ? (
          <AuditInProgressView
            jobId={activeJobId}
            targetUrl={activeUrl}
            onAuditComplete={handleAuditCompleted}
            onRetry={() => handleStartAudit(activeUrl)}
            onReturnToDashboard={() => {
              setActiveJobId(null);
              handleNavigate('landing');
            }}
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="Audit Progress Tracker"
          />
        )
      )}

      {/* 3. DASHBOARD OVERVIEW */}
      {currentView === 'overview' && (
        activeReport ? (
          <div>
            <IntelligenceScoreCard
              readinessScore={activeReport.readiness.score}
              performanceScore={activeWebsite?.latest_performance_score || 88}
              engagementScore={
                activeReport?.engagement?.score ??
                activeWebsite?.latest_engagement_score ??
                98
              }
              healthScore={
                activeWebsite?.latest_health_score ||
                Math.round(
                  ((activeReport.readiness.score || 80) * 0.5) +
                  ((activeReport.engagement?.score || 95) * 0.5)
                )
              }
              hasVisitorAnalytics={activeWebsite?.is_verified ?? true}
            />

            <ReportOverviewView
              report={activeReport}
              isSampleReport={isSampleReport}
              onNavigateToFindings={(sev) => {
                if (sev && sev !== 'all') setSelectedSeverity(sev);
                handleNavigate('findings');
              }}
              onNavigateToFindingDetail={(findingId: string) => {
                const f = activeReport.findings.find((x) => x.id === findingId);
                if (f) handleSelectFinding(f);
              }}
              onNavigateToRecommendations={() => handleNavigate('recommendations')}
              onDownloadReport={handleDownloadReport}
              onNewAudit={() => {
                setActiveReport(null);
                setActiveJobId(null);
                handleNavigate('landing');
              }}
            />
          </div>
        ) : isAuditInProgress ? (
          <AuditInProgressPlaceholder
            targetUrl={activeUrl}
            onViewProgress={() => handleNavigate('in_progress')}
            sectionName="Dashboard Overview"
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="Dashboard Overview"
          />
        )
      )}

      {/* 4. AI READINESS VIEW */}
      {currentView === 'ai_readiness' && (
        activeReport ? (
          <div>
            <PageHeading
              eyebrow="MODULE A &middot; AI READINESS"
              title={`AI Discoverability & Extractability &middot; ${activeReport.site}`}
              subtitle="Inspect AI bots robots.txt directives, Schema.org entity graphs, and content density."
            />
            <AICrawlersSection url={activeReport.site} />
            <FindingsView
              report={activeReport}
              selectedSeverity={selectedSeverity}
              onSeverityChange={setSelectedSeverity}
              selectedSkill={selectedSkill}
              onSkillChange={setSelectedSkill}
              selectedPage={selectedPage}
              onPageChange={setSelectedPage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onResetFilters={() => {
                setSelectedSeverity('all');
                setSelectedSkill('all');
                setSelectedPage('all');
                setSearchQuery('');
              }}
              onSelectFinding={handleSelectFinding}
            />
          </div>
        ) : isAuditInProgress ? (
          <AuditInProgressPlaceholder
            targetUrl={activeUrl}
            onViewProgress={() => handleNavigate('in_progress')}
            sectionName="AI Readiness Intelligence"
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="AI Readiness Intelligence"
          />
        )
      )}

      {/* 5. PERFORMANCE LAB VIEW */}
      {currentView === 'performance' && (
        activeReport ? (
          <PerformanceView
            websiteId={activeWebsite?.id}
            targetUrl={activeReport.site.startsWith('http') ? activeReport.site : `https://${activeReport.site}`}
            onNavigateToOverview={() => handleNavigate('overview')}
          />
        ) : isAuditInProgress ? (
          <AuditInProgressPlaceholder
            targetUrl={activeUrl}
            onViewProgress={() => handleNavigate('in_progress')}
            sectionName="Performance Lab"
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="Performance Lab"
          />
        )
      )}

      {/* 6. VISITOR ANALYTICS VIEW */}
      {currentView === 'analytics' && (
        activeReport ? (
          <AnalyticsView
            website={activeWebsite}
            onNavigateToSettings={() => handleNavigate('settings')}
          />
        ) : isAuditInProgress ? (
          <AuditInProgressPlaceholder
            targetUrl={activeUrl}
            onViewProgress={() => handleNavigate('in_progress')}
            sectionName="Visitor Analytics"
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="Visitor Analytics"
          />
        )
      )}

      {/* 7. HISTORY & COMPARISON VIEW */}
      {currentView === 'history_comparison' && (
        <HistoryComparisonView
          website={activeWebsite}
          onSelectAudit={handleViewPreviousAudit}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* 8. FINDINGS MATRIX VIEW */}
      {currentView === 'findings' && (
        activeReport ? (
          <FindingsView
            report={activeReport}
            selectedSeverity={selectedSeverity}
            onSeverityChange={setSelectedSeverity}
            selectedSkill={selectedSkill}
            onSkillChange={setSelectedSkill}
            selectedPage={selectedPage}
            onPageChange={setSelectedPage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={() => {
              setSelectedSeverity('all');
              setSelectedSkill('all');
              setSelectedPage('all');
              setSearchQuery('');
            }}
            onSelectFinding={handleSelectFinding}
          />
        ) : isAuditInProgress ? (
          <AuditInProgressPlaceholder
            targetUrl={activeUrl}
            onViewProgress={() => handleNavigate('in_progress')}
            sectionName="Findings Matrix"
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="Findings Matrix"
          />
        )
      )}

      {/* 9. FINDING DETAILS */}
      {currentView === 'finding_detail' && (
        activeReport && currentFinding ? (
          <FindingDetailView
            key={currentFinding.id}
            finding={currentFinding}
            siteUrl={activeReport.site}
            auditedAt={activeReport.audited_at}
            reportRecommendations={activeReport.recommendations}
            activeFilterSummary={selectedSeverity !== 'all' ? `Severity: ${selectedSeverity}` : 'All Findings'}
            onBack={() => handleNavigate('findings')}
          />
        ) : isAuditInProgress ? (
          <AuditInProgressPlaceholder
            targetUrl={activeUrl}
            onViewProgress={() => handleNavigate('in_progress')}
            sectionName="Finding Details"
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="Finding Details"
          />
        )
      )}

      {/* 10. RECOMMENDATIONS ACTION PLAN */}
      {currentView === 'recommendations' && (
        activeReport ? (
          <RecommendationsView
            report={activeReport}
            onSelectRecommendation={(rec) => {
              const match = activeReport.findings.find((f) => f.id === rec.finding_id);
              if (match) handleSelectFinding(match);
              else handleNavigate('findings');
            }}
            onDownloadReport={handleDownloadReport}
            onNavigateToOverview={() => handleNavigate('overview')}
            onNavigateToFindingDetail={(findingId) => {
              const match = activeReport.findings.find((f) => f.id === findingId);
              if (match) handleSelectFinding(match);
              else handleNavigate('findings');
            }}
          />
        ) : isAuditInProgress ? (
          <AuditInProgressPlaceholder
            targetUrl={activeUrl}
            onViewProgress={() => handleNavigate('in_progress')}
            sectionName="Action Plan"
          />
        ) : (
          <NoAuditCompletedPlaceholder
            onStartAudit={() => handleNavigate('landing')}
            onLoadSample={handleLoadSample}
            sectionName="Action Plan"
          />
        )
      )}

      {/* 11. SETTINGS VIEW */}
      {currentView === 'settings' && (
        <SettingsView
          currentUser={currentUser}
          websites={currentUser ? websites : []}
          activeWebsite={currentUser ? activeWebsite : null}
          onSelectWebsite={setActiveWebsite}
          onRefreshWebsites={refreshWebsites}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* User Login/Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshWebsites();
        }}
      />
    </AppShell>
  );
}
