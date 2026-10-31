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

const EmptyAuditState: React.FC<{ onNewAudit: () => void; onLoadSample: () => void }> = ({
  onNewAudit,
  onLoadSample,
}) => (
  <div style={{ maxWidth: '720px', margin: 'var(--space-8) auto', padding: '0 var(--space-4)' }}>
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
        No Active Audit
      </div>
      <h2
        className="font-serif"
        style={{
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-charcoal)',
          fontWeight: 500,
          marginBottom: 'var(--space-3)',
        }}
      >
        No Audit Report Loaded
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-charcoal-muted)',
          maxWidth: '460px',
          margin: '0 auto var(--space-6)',
          lineHeight: 'var(--leading-relaxed)',
        }}
      >
        Run a live audit on any public website to inspect AI-readiness, Core Web Vitals, and engagement, or open the sample audit report.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={onNewAudit}>
          Start New Audit
        </Button>
        <Button variant="secondary" onClick={onLoadSample}>
          Open Sample Report
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

  // Load session & websites on mount
  const refreshWebsites = async () => {
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
          refreshWebsites();
        }
      })
      .catch(() => {});
  }, []);

  // Refresh alerts count when active website changes
  useEffect(() => {
    if (activeWebsite?.id) {
      getWebsiteAlerts(activeWebsite.id, true)
        .then((alerts) => setUnreadAlertsCount(alerts.length))
        .catch(() => {});
    }
  }, [activeWebsite?.id]);

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

  // Synchronize active website to the active report domain whenever a report is loaded or viewed
  useEffect(() => {
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
          user_id: currentUser?.id || 'demo_user',
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
  }, [activeReport?.site, currentUser?.id, websites]);

  const handleStartAudit = async (targetUrl: string) => {
    setIsLoading(true);
    setApiError(undefined);
    setActiveUrl(targetUrl);
    setIsSampleReport(false);

    const targetDomain = extractDomain(targetUrl);

    // Sync active website immediately to match the audited domain
    const matchedSite = websites.find(
      (w) => w.domain.toLowerCase() === targetDomain || targetDomain.includes(w.domain.toLowerCase())
    );

    if (matchedSite) {
      setActiveWebsite(matchedSite);
    } else {
      const pendingSite: Website = {
        id: `site-${targetDomain.replace(/[^a-zA-Z0-9]/g, '_')}`,
        user_id: currentUser?.id || 'demo_user',
        name: targetDomain,
        domain: targetDomain,
        canonical_url: targetUrl.startsWith('http') ? targetUrl : `https://${targetDomain}`,
        category: 'General',
        verification_token: `canopy_verify_${Math.random().toString(36).substring(2, 10)}`,
        is_verified: true,
        verified_at: new Date().toISOString(),
        monitoring_enabled: true,
        monitoring_frequency: 'daily',
        last_audit_at: new Date().toISOString(),
        latest_readiness_score: 83,
        latest_performance_score: 88,
        latest_engagement_score: 98,
        latest_health_score: 89,
        created_at: new Date().toISOString(),
      };
      setWebsites((prev) => [pendingSite, ...prev.filter((w) => w.domain !== targetDomain)]);
      setActiveWebsite(pendingSite);

      if (currentUser) {
        createWebsite(targetUrl, targetDomain, 'Audited Site')
          .then((saved) => {
            setWebsites((prev) => [saved, ...prev.filter((w) => w.domain !== targetDomain)]);
            setActiveWebsite(saved);
          })
          .catch(() => {});
      }
    }

    try {
      const job = await createAuditJob(targetUrl, matchedSite?.id);
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
    try {
      const sample = await getSampleReport();
      setActiveReport(sample);
      setIsSampleReport(true);
      setActiveUrl(sample.site);
      const domain = extractDomain(sample.site);
      const sampleSite: Website = {
        id: 'sample-jiitshelf',
        user_id: currentUser?.id || 'demo_user',
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
    const domain = extractDomain(report.site);

    setActiveWebsite((prev) => {
      const updatedSite: Website = {
        id: prev?.domain.toLowerCase() === domain ? prev.id : `site-${domain.replace(/[^a-zA-Z0-9]/g, '_')}`,
        user_id: currentUser?.id || 'demo_user',
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

    handleNavigate('overview');
  };

  const handleSelectWebsite = async (site: Website) => {
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
      onNewAudit={() => handleNavigate('landing')}
      onLoadSample={handleLoadSample}
      findingsCount={findingsCount}
      unreadAlertsCount={unreadAlertsCount}
      currentUser={currentUser}
      onOpenAuth={() => setIsAuthModalOpen(true)}
      websites={websites}
      activeWebsite={activeWebsite}
      onSelectWebsite={handleSelectWebsite}
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
            onReturnToDashboard={() => handleNavigate('landing')}
          />
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
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
              onNewAudit={() => handleNavigate('landing')}
            />
          </div>
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 4. AI READINESS VIEW */}
      {currentView === 'ai_readiness' && (
        activeReport ? (
          <div>
            <PageHeading
              eyebrow="MODULE A — AI READINESS"
              title={`AI Discoverability & Extractability — ${activeReport.site}`}
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
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 5. PERFORMANCE LAB VIEW */}
      {currentView === 'performance' && (
        <PerformanceView
          websiteId={activeWebsite?.id}
          targetUrl={activeUrl || activeWebsite?.canonical_url || (activeReport?.site ? `https://${activeReport.site}` : 'https://github.com')}
          onNavigateToOverview={() => handleNavigate('overview')}
        />
      )}

      {/* 6. VISITOR ANALYTICS VIEW */}
      {currentView === 'analytics' && (
        <AnalyticsView
          website={activeWebsite}
          onNavigateToSettings={() => handleNavigate('settings')}
        />
      )}

      {/* 7. HISTORY & COMPARISON VIEW */}
      {currentView === 'history_comparison' && (
        <HistoryComparisonView
          website={activeWebsite}
          onSelectAudit={handleViewPreviousAudit}
        />
      )}

      {/* 9. FINDINGS MATRIX VIEW */}
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
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 10. FINDING DETAILS */}
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
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 11. RECOMMENDATIONS ACTION PLAN */}
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
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 12. SETTINGS VIEW */}
      {currentView === 'settings' && (
        <SettingsView
          currentUser={currentUser}
          websites={websites}
          activeWebsite={activeWebsite}
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
