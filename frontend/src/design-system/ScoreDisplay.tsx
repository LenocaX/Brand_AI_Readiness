import React from 'react';
import { Badge } from './Badge';

export interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  label?: string;
  variant?: 'readiness' | 'engagement';
  description?: string;
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  score,
  maxScore = 100,
  label,
  className = '',
}) => {
  // Determine restrained badge variant based on score / label
  let badgeVariant: 'success' | 'medium' | 'critical' | 'neutral' = 'neutral';
  if (score >= 85) badgeVariant = 'success';
  else if (score >= 60) badgeVariant = 'medium';
  else badgeVariant = 'critical';

  return (
    <div className={`score-card ${className}`.trim()}>
      <div className="score-header">
        <span className="score-title">{title}</span>
        {label && (
          <Badge variant={badgeVariant}>
            {label}
          </Badge>
        )}
      </div>

      <div className="score-body">
        <span className="score-num">{score}</span>
        <span className="score-denom">/{maxScore}</span>
      </div>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <div className="meter-track">
          <div
            className={`meter-fill ${
              score >= 85
                ? 'meter-fill-success'
                : score >= 60
                ? 'meter-fill-medium'
                : 'meter-fill-critical'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export interface DimensionMeterProps {
  label: string;
  score: number;
  maxScore?: number;
}

export const DimensionMeter: React.FC<DimensionMeterProps> = ({
  label,
  score,
  maxScore = 100,
}) => {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          marginBottom: 'var(--space-1)',
          color: 'var(--color-charcoal)',
        }}
      >
        <span>{label}</span>
        <span className="font-mono" style={{ color: 'var(--color-charcoal-muted)' }}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="meter-track" style={{ height: '4px' }}>
        <div
          className="meter-fill"
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
            backgroundColor: 'var(--color-forest)',
          }}
        />
      </div>
    </div>
  );
};
