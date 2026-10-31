import React from 'react';
import { Button } from '../design-system/Button';
import { ActiveView, User, Website } from '../types/audit';

export interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenAbout: () => void;
  onOpenHowItWorks: () => void;
  onLoadSample: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  websites?: Website[];
  activeWebsite?: Website | null;
  onSelectWebsite?: (site: Website) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAbout,
  onOpenHowItWorks,
  onLoadSample,
  currentUser,
  onOpenAuth,
  websites = [],
  activeWebsite,
  onSelectWebsite,
}) => {
  // Ensure the list of websites always includes the activeWebsite so the dropdown accurately displays it
  const displayedWebsites = React.useMemo(() => {
    const list = [...websites];
    if (activeWebsite) {
      const matchIdx = list.findIndex(
        (w) => w.id === activeWebsite.id || w.domain.toLowerCase() === activeWebsite.domain.toLowerCase()
      );
      if (matchIdx >= 0) {
        // Keep the activeWebsite reference and sync ID
        list[matchIdx] = { ...list[matchIdx], ...activeWebsite };
      } else {
        list.unshift(activeWebsite);
      }
    }
    return list;
  }, [websites, activeWebsite]);

  // Compute the exact matching select value to prevent HTML <select> defaulting to first item
  const selectedSiteId = React.useMemo(() => {
    if (!activeWebsite) return displayedWebsites[0]?.id || '';
    const match = displayedWebsites.find(
      (w) => w.id === activeWebsite.id || w.domain.toLowerCase() === activeWebsite.domain.toLowerCase()
    );
    return match ? match.id : (activeWebsite.id || displayedWebsites[0]?.id || '');
  }, [displayedWebsites, activeWebsite]);

  return (
    <header className="app-header" role="banner">
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
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

        {/* Website Switcher Dropdown */}
        {displayedWebsites.length > 0 && onSelectWebsite && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'rgba(245, 243, 235, 0.7)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
              Site:
            </span>
            <select
              value={selectedSiteId}
              onChange={(e) => {
                const found = displayedWebsites.find((w) => w.id === e.target.value);
                if (found) onSelectWebsite(found);
              }}
              aria-label="Select Active Website"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: 'var(--color-ivory)',
                border: '1px solid var(--color-forest-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 500,
              }}
            >
              {displayedWebsites.map((w) => (
                <option key={w.id} value={w.id} style={{ color: 'var(--color-charcoal)', backgroundColor: 'var(--color-surface-white)' }}>
                  {w.name || w.domain} ({w.domain})
                </option>
              ))}
            </select>
          </div>
        )}
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

        {/* User Auth indicator */}
        {currentUser ? (
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--color-forest-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-ivory)',
              padding: '4px 10px',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            {currentUser.full_name || currentUser.email.split('@')[0]}
          </button>
        ) : (
          onOpenAuth && (
            <Button variant="secondary" size="sm" onClick={onOpenAuth}>
              Sign In
            </Button>
          )
        )}
      </nav>
    </header>
  );
};
