import React from 'react';
import { Button } from '../design-system/Button';
import { ActiveView } from '../types/audit';

export interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onNewAudit: () => void;
  findingsCount?: number;
  unreadAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onNewAudit,
  findingsCount = 0,
}) => {
  return (
    <aside className="app-sidebar" aria-label="Sidebar Navigation">
      <div className="sidebar-body">
        <Button
          variant="outline-ivory"
          size="sm"
          fullWidth
          onClick={onNewAudit}
          style={{
            justifyContent: 'flex-start',
            borderColor: 'var(--color-forest-border)',
            color: 'var(--color-ivory)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <span className="symbol-plus">New Audit</span>
        </Button>

        <nav aria-label="Audit views">
          <ul className="sidebar-nav">
            {/* 1. Overview */}
            <li>
              <button
                className={`sidebar-link ${currentView === 'overview' ? 'active' : ''}`}
                onClick={() => onNavigate('overview')}
                aria-current={currentView === 'overview' ? 'page' : undefined}
              >
                <span>Dashboard Overview</span>
              </button>
            </li>

            {/* 2. AI Readiness */}
            <li>
              <button
                className={`sidebar-link ${currentView === 'ai_readiness' ? 'active' : ''}`}
                onClick={() => onNavigate('ai_readiness')}
                aria-current={currentView === 'ai_readiness' ? 'page' : undefined}
              >
                <span>AI Readiness</span>
              </button>
            </li>

            {/* 3. Performance Lab */}
            <li>
              <button
                className={`sidebar-link ${currentView === 'performance' ? 'active' : ''}`}
                onClick={() => onNavigate('performance')}
                aria-current={currentView === 'performance' ? 'page' : undefined}
              >
                <span>Performance Lab</span>
              </button>
            </li>

            {/* 4. Visitor Analytics */}
            <li>
              <button
                className={`sidebar-link ${currentView === 'analytics' ? 'active' : ''}`}
                onClick={() => onNavigate('analytics')}
                aria-current={currentView === 'analytics' ? 'page' : undefined}
              >
                <span>Visitor Analytics</span>
              </button>
            </li>

            {/* 5. History & Comparison */}
            <li>
              <button
                className={`sidebar-link ${currentView === 'history_comparison' ? 'active' : ''}`}
                onClick={() => onNavigate('history_comparison')}
                aria-current={currentView === 'history_comparison' ? 'page' : undefined}
              >
                <span>History & Diffing</span>
              </button>
            </li>

            <li style={{ margin: 'var(--space-2) 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} />

            {/* Deep Audit Explorers */}
            <li>
              <button
                className={`sidebar-link ${currentView === 'findings' || currentView === 'finding_detail' ? 'active' : ''}`}
                onClick={() => onNavigate('findings')}
                aria-current={currentView === 'findings' ? 'page' : undefined}
                style={{ justifyContent: 'space-between' }}
              >
                <span>Findings Matrix</span>
                {findingsCount > 0 && (
                  <span
                    style={{
                      fontSize: 'var(--text-2xs)',
                      padding: '1px 6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {findingsCount}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                className={`sidebar-link ${currentView === 'recommendations' ? 'active' : ''}`}
                onClick={() => onNavigate('recommendations')}
                aria-current={currentView === 'recommendations' ? 'page' : undefined}
              >
                <span>Action Plan</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button
          className={`sidebar-link ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          style={{ padding: '0.25rem 0', color: 'rgba(245, 243, 235, 0.75)' }}
        >
          <span>Settings & Properties</span>
        </button>
      </div>
    </aside>
  );
};
