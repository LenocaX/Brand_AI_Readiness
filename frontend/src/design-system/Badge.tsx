import React from 'react';
import { SeverityLevel } from '../types/audit';

export type BadgeVariant =
  | SeverityLevel
  | 'success'
  | 'neutral'
  | 'forest'
  | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  showDot = false,
  className = '',
  style,
}) => {
  const variantClass = `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} style={style}>
      {showDot && (
        <span
          className="symbol-dot"
          style={{ width: '6px', height: '6px', backgroundColor: 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
};
