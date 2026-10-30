import React from 'react';
import { Button } from '../design-system/Button';
import { ActiveView } from '../types/audit';

export interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onNewAudit: () => void;
  findingsCount?: number;
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
          }}
        >
          <span className="symbol-plus">New Audit</span>
        </Button>

        <nav aria-label="Audit views">
          <ul className="sidebar-nav">
            <li>
              <button
                className={`sidebar-link ${currentView === 'overview' ? 'active' : ''}`}
                onClick={() => onNavigate('overview')}
                aria-current={currentView === 'overview' ? 'page' : undefined}
              >
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className={`sidebar-link ${currentView === 'findings' || currentView === 'finding_detail' ? 'active' : ''}`}
                onClick={() => onNavigate('findings')}
                aria-current={currentView === 'findings' ? 'page' : undefined}
                style={{ justifyContent: 'space-between' }}
              >
                <span>Findings</span>
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
                <span>Recommendations</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-link"
          onClick={() => onNavigate('settings')}
          style={{ padding: '0.25rem 0', color: 'rgba(245, 243, 235, 0.65)' }}
        >
          <span>Methodology & Settings</span>
        </button>
      </div>
    </aside>
  );
};
