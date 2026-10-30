import React from 'react';
import { BrandMark } from '../design-system/Indicators';
import { Button } from '../design-system/Button';
import { ActiveView } from '../types/audit';

export interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
  onOpenHowItWorks: () => void;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAbout,
  onOpenHowItWorks,
  onLoadSample,
}) => {
  return (
    <header className="app-header" role="banner">
      <div className="header-brand">
        <BrandMark size={20} color="var(--color-sage)" />
        <button
          onClick={() => onNavigate('landing')}
          style={{
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-ivory)',
            letterSpacing: 'var(--tracking-tight)',
            cursor: 'pointer',
          }}
        >
          Brand AI-Readiness Audit
        </button>
      </div>

      <nav className="header-nav" aria-label="Main Navigation">
        <button
          className="header-link"
          onClick={() => onNavigate('landing')}
          style={currentView === 'landing' ? { color: 'var(--color-sage)', fontWeight: 600 } : undefined}
        >
          Home
        </button>
        <button
          className="header-link"
          onClick={onOpenAbout}
        >
          About
        </button>
        <button
          className="header-link"
          onClick={onOpenHowItWorks}
        >
          How it works
        </button>
        <Button
          variant="outline-ivory"
          size="sm"
          onClick={onLoadSample}
        >
          View Sample Report
        </Button>
      </nav>
    </header>
  );
};
