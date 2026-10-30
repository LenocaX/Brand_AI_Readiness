import React from 'react';

export interface FooterProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenPrivacy }) => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-ivory)',
        padding: 'var(--space-6) var(--space-8)',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-content-width)',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-charcoal-muted)',
        }}
      >
        <div>
          <span>Brand AI-Readiness Audit Platform</span>
          <span style={{ margin: '0 var(--space-2)' }}>·</span>
          <span>Read-only automated audit</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <button
            onClick={onOpenTerms}
            style={{
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              color: 'var(--color-charcoal)',
            }}
          >
            Terms of Service
          </button>
          <button
            onClick={onOpenPrivacy}
            style={{
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              color: 'var(--color-charcoal)',
            }}
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </footer>
  );
};
