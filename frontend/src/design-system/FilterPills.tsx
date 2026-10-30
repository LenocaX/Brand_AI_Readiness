import React from 'react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterPillsProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  options,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`filter-bar ${className}`.trim()} role="tablist">
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={isActive}
            className={`filter-pill ${isActive ? 'active' : ''}`}
            onClick={() => onChange(opt.id)}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span style={{ marginLeft: 'var(--space-1)', opacity: 0.85 }}>
                ({opt.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
