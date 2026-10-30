import React from 'react';

interface IndicatorProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Clean, restrained SVG glyphs and geometric indicators.
 * Strictly avoids Lucide or external icon packages.
 */

export const BrandMark: React.FC<IndicatorProps> = ({ size = 20, color = 'var(--color-sage)' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 16V8l5 5 5-5v8" />
  </svg>
);

export const ChevronRight: React.FC<IndicatorProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 3 11 8 6 13" />
  </svg>
);

export const ChevronLeft: React.FC<IndicatorProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="10 3 5 8 10 13" />
  </svg>
);

export const ArrowRight: React.FC<IndicatorProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="8" x2="13" y2="8" />
    <polyline points="9 4 13 8 9 12" />
  </svg>
);

export const ExternalLink: React.FC<IndicatorProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 9v4H3V4h4" />
    <polyline points="9 3 13 3 13 7" />
    <line x1="6" y1="10" x2="13" y2="3" />
  </svg>
);

export const DownloadIcon: React.FC<IndicatorProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 13h10" />
    <polyline points="5 7 8 10 11 7" />
    <line x1="8" y1="2" x2="8" y2="10" />
  </svg>
);

export const CloseIcon: React.FC<IndicatorProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

export const MenuIcon: React.FC<IndicatorProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="5" x2="15" y2="5" />
    <line x1="3" y1="9" x2="15" y2="9" />
    <line x1="3" y1="13" x2="15" y2="13" />
  </svg>
);

export const CopyIcon: React.FC<IndicatorProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="5" width="8" height="8" rx="1" />
    <path d="M3 11V3h8" />
  </svg>
);

export const CheckIcon: React.FC<IndicatorProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 8 6 11 13 4" />
  </svg>
);

export const StatusDot: React.FC<{
  status?: 'completed' | 'in_progress' | 'pending' | 'waiting' | 'failed' | 'active';
  size?: number;
}> = ({ status = 'pending', size = 8 }) => {
  let color = 'var(--color-charcoal-subtle)';
  if (status === 'completed' || status === 'active') color = 'var(--color-success)';
  if (status === 'in_progress') color = 'var(--color-forest)';
  if (status === 'waiting') color = 'var(--color-medium)';
  if (status === 'failed') color = 'var(--color-critical)';

  return (
    <span
      className="symbol-dot"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
      }}
      aria-hidden="true"
    />
  );
};
