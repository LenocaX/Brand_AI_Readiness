import React from 'react';
import { SpecialistStatus } from '../types/audit';
import { Badge } from './Badge';

export interface ProgressRowProps {
  stepNumber: number;
  title: string;
  description: string;
  status: SpecialistStatus;
  progressPercent?: number;
}

export const ProgressRow: React.FC<ProgressRowProps> = ({
  stepNumber,
  title,
  description,
  status,
  progressPercent,
}) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isFailed = status === 'failed';

  let statusText = 'Pending';
  let badgeVariant: 'success' | 'forest' | 'medium' | 'critical' | 'neutral' = 'neutral';

  if (isCompleted) {
    statusText = 'Completed';
    badgeVariant = 'success';
  } else if (isInProgress) {
    statusText = 'In progress';
    badgeVariant = 'forest';
  } else if (isFailed) {
    statusText = 'Failed';
    badgeVariant = 'critical';
  } else if (status === 'waiting') {
    statusText = 'Waiting';
    badgeVariant = 'neutral';
  }

  return (
    <div className="progress-card">
      <div className="progress-left">
        <div className={`progress-number ${isCompleted ? 'completed' : ''}`}>
          {stepNumber}
        </div>
        <div className="progress-content">
          <div className="progress-title">{title}</div>
          <div className="progress-desc">{description}</div>

          {isInProgress && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div className="meter-track" style={{ height: '4px' }}>
                <div
                  className="meter-fill"
                  style={{
                    width: `${progressPercent ?? 65}%`,
                    backgroundColor: 'var(--color-forest)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="progress-right">
        <Badge variant={badgeVariant} showDot>
          {statusText}
        </Badge>
      </div>
    </div>
  );
};
