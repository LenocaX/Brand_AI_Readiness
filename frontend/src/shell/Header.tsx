import React from 'react';
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
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="header-brand-button"
          aria-label="Canopy Home"
          style={{
            background: 'var(--color-ivory-light)',
            border: '1px solid var(--color-forest-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            transition: 'opacity 0.15s ease',
          }}
        >
          <img
            src="/canopy-web-logo.svg"
            alt="Canopy"
            style={{
              height: '24px',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
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
