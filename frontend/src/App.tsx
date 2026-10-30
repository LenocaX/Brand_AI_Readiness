import { useState, useMemo } from 'react';
import { AppShell } from './shell/AppShell';
import { LandingPage } from './views/LandingPage';
import { AuditInProgressView } from './views/AuditInProgressView';
import { ReportOverviewView } from './views/ReportOverviewView';
import { FindingsView } from './views/FindingsView';
import { FindingDetailView } from './views/FindingDetailView';
import { RecommendationsView } from './views/RecommendationsView';
import { ActiveView, AuditReport, Finding, AuditJob } from './types/audit';
import { sampleReport } from './mock/sampleReport';
import { createAuditJob, getSampleReport, AuditApiError } from './api/client';
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
        Run a live audit on any public website to inspect AI-readiness and engagement, or open the sample audit report.
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
    if (v && ['landing', 'in_progress', 'overview', 'findings', 'finding_detail', 'recommendations', 'settings'].includes(v)) {
      return v as ActiveView;
    }
    const hash = window.location.hash.replace('#', '');
    if (hash && ['landing', 'in_progress', 'overview', 'findings', 'finding_detail', 'recommendations', 'settings'].includes(hash)) {
      return hash as ActiveView;
    }
  }
  return 'landing';
};

const getInitialJobId = (): string | null => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('job_id') || params.get('jobId');
  }
  return null;
};

const getInitialFindingId = (): string | null => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('finding_id') || params.get('findingId');
  }
  return null;
};

export function App() {
  const [currentView, setCurrentView] = useState<ActiveView>(getInitialView);
  const [activeUrl, setActiveUrl] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(getInitialJobId);
  const [activeJob, setActiveJob] = useState<AuditJob | null>(null);
  const [activeReport, setActiveReport] = useState<AuditReport | null>(null);
  const [isSampleReport, setIsSampleReport] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>(undefined);

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

  // Findings exploration state
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedPage, setSelectedPage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(getInitialFindingId);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Authentically resolve current finding from activeReport
  const currentFinding = useMemo(() => {
    if (!activeReport || activeReport.findings.length === 0) return null;
    if (selectedFinding) {
      const match = activeReport.findings.find((f) => f.id === selectedFinding.id);
      if (match) return match;
    }
    if (selectedFindingId) {
      const match = activeReport.findings.find((f) => f.id === selectedFindingId);
      if (match) return match;
    }
    return activeReport.findings[0];
  }, [activeReport, selectedFinding, selectedFindingId]);

  const handleSelectFinding = (finding: Finding) => {
    setSelectedFinding(finding);
    setSelectedFindingId(finding.id);
    handleNavigate('finding_detail', { finding_id: finding.id });
  };

  const handleResetFilters = () => {
    setSelectedSeverity('all');
    setSelectedSkill('all');
    setSelectedPage('all');
    setSearchQuery('');
  };

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedSeverity !== 'all') parts.push(selectedSeverity);
    if (selectedSkill !== 'all') parts.push(selectedSkill);
    if (selectedPage !== 'all') parts.push('page filtered');
    if (searchQuery.trim()) parts.push(`"${searchQuery.trim()}"`);
    return parts.join(', ');
  }, [selectedSeverity, selectedSkill, selectedPage, searchQuery]);

  // Trigger real asynchronous audit job in backend
  const handleStartAudit = async (targetUrl: string) => {
    if (isLoading) return; // Prevent repeated clicks

    setIsLoading(true);
    setApiError(undefined);
    setActiveUrl(targetUrl);
    setActiveReport(null);
    setIsSampleReport(false);
    setSelectedFinding(null);
    setSelectedFindingId(null);

    try {
      const job = await createAuditJob(targetUrl);
      setActiveJobId(job.job_id);
      setActiveJob(job);
      handleNavigate('in_progress', { job_id: job.job_id });
    } catch (err: unknown) {
      console.error('Audit job creation failed:', err);
      if (err instanceof AuditApiError) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred while connecting to the audit service.');
      }
      handleNavigate('landing');
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample report from backend endpoint or bundled sample
  const handleLoadSample = async () => {
    setIsLoading(true);
    setApiError(undefined);
    try {
      const sample = await getSampleReport();
      setActiveReport(sample);
      setIsSampleReport(true);
      setActiveUrl(`https://${sample.site}`);
      handleNavigate('overview');
    } catch (err) {
      console.warn('Error loading sample report, using bundled fallback:', err);
      setActiveReport(sampleReport);
      setIsSampleReport(true);
      setActiveUrl(`https://${sampleReport.site}`);
      handleNavigate('overview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!activeReport) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_report_${activeReport.site}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <AppShell
      currentView={currentView}
      onNavigate={handleNavigate}
      onNewAudit={() => handleNavigate('landing')}
      onLoadSample={handleLoadSample}
      findingsCount={activeReport ? activeReport.findings.length : 0}
    >
      {/* 1. LANDING VIEW */}
      {currentView === 'landing' && (
        <LandingPage
          onStartAudit={handleStartAudit}
          onViewSample={handleLoadSample}
          isLoading={isLoading}
          errorMessage={apiError}
          onOpenAbout={() => {
            // Trigger about modal in shell via custom event or view
            const aboutBtn = document.querySelector('.header-link:nth-child(2)') as HTMLButtonElement | null;
            if (aboutBtn) aboutBtn.click();
          }}
          onOpenHowItWorks={() => {
            const howBtn = document.querySelector('.header-link:nth-child(3)') as HTMLButtonElement | null;
            if (howBtn) howBtn.click();
          }}
        />
      )}

      {/* 2. AUDIT IN PROGRESS VIEW */}
      {currentView === 'in_progress' && (
        <AuditInProgressView
          jobId={activeJobId || 'latest-job'}
          initialJob={activeJob || undefined}
          targetUrl={activeUrl}
          onAuditComplete={(report) => {
            setActiveReport(report);
            setIsSampleReport(false);
            handleNavigate('overview');
          }}
          onRetry={() => {
            handleStartAudit(activeUrl);
          }}
          onReturnToDashboard={() => {
            handleNavigate('landing');
          }}
        />
      )}

      {/* 3. REPORT OVERVIEW DASHBOARD */}
      {currentView === 'overview' && (
        activeReport ? (
          <ReportOverviewView
            report={activeReport}
            isSampleReport={isSampleReport}
            onNavigateToFindings={(severity) => {
              if (severity) {
                setSelectedSeverity(severity);
              }
              handleNavigate('findings');
            }}
            onNavigateToFindingDetail={(findingId) => {
              const found = activeReport.findings.find((f) => f.id === findingId);
              if (found) {
                handleSelectFinding(found);
              } else {
                handleNavigate('findings');
              }
            }}
            onNavigateToRecommendations={() => handleNavigate('recommendations')}
            onDownloadReport={handleDownloadReport}
            onNewAudit={() => handleNavigate('landing')}
          />
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 4. FINDINGS EXPLORER */}
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
            onResetFilters={handleResetFilters}
            onSelectFinding={handleSelectFinding}
          />
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 5. FINDING DETAILS */}
      {currentView === 'finding_detail' && (
        activeReport ? (
          currentFinding ? (
            <FindingDetailView
              key={currentFinding.id}
              finding={currentFinding}
              siteUrl={activeReport.site}
              auditedAt={activeReport.audited_at}
              reportRecommendations={activeReport.recommendations}
              activeFilterSummary={activeFilterSummary}
              onBack={() => handleNavigate('findings')}
            />
          ) : (
            <div style={{ maxWidth: '800px', margin: 'var(--space-8) auto', padding: '0 var(--space-4)' }}>
              <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-8)', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-charcoal-muted)', marginBottom: 'var(--space-4)' }}>No findings available in this audit report.</p>
                <Button variant="secondary" onClick={() => handleNavigate('findings')}>Back to Findings</Button>
              </div>
            </div>
          )
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 6. RECOMMENDATIONS ACTION PLAN */}
      {currentView === 'recommendations' && (
        activeReport ? (
          <RecommendationsView
            report={activeReport}
            onSelectRecommendation={(rec) => {
              const match = activeReport.findings.find((f) => f.id === rec.finding_id);
              if (match) {
                handleSelectFinding(match);
              } else {
                handleNavigate('findings');
              }
            }}
            onDownloadReport={handleDownloadReport}
            onNavigateToOverview={() => handleNavigate('overview')}
            onNavigateToFindingDetail={(findingId) => {
              const match = activeReport.findings.find((f) => f.id === findingId);
              if (match) {
                handleSelectFinding(match);
              } else {
                handleNavigate('findings');
              }
            }}
          />
        ) : (
          <EmptyAuditState onNewAudit={() => handleNavigate('landing')} onLoadSample={handleLoadSample} />
        )
      )}

      {/* 7. SETTINGS / METHODOLOGY VIEW */}
      {currentView === 'settings' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <PageHeading
            eyebrow="AUDIT CONFIGURATION"
            title="Methodology & Engine Settings"
            subtitle="Details regarding the five specialist skills, scoring penalty model, and crawler boundaries."
          />

          <div
            style={{
              backgroundColor: 'var(--color-surface-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Scoring Deductions</h3>
            <p>
              AI-Readiness score starts at 100 points. Penalties are applied on an additive basis according to findings detected by specialist skills:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <li>Critical severity findings deduct 25 points each.</li>
              <li>High severity findings deduct 10 points each.</li>
              <li>Medium severity findings deduct 5 points each.</li>
              <li>Low severity findings deduct 2 points each.</li>
            </ul>
            <p style={{ marginTop: 'var(--space-2)' }}>
              Scores are bounded between 0 and 100. Audit reports are strictly read-only and conform to automated schema validation.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
