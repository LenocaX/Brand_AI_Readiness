import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  actionButton?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  actionButton,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`input-wrapper ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)', width: '100%' }}>
        <input
          id={inputId}
          className="input-field"
          style={errorMessage ? { borderColor: 'var(--color-critical)' } : undefined}
          {...props}
        />
        {actionButton}
      </div>
      {errorMessage ? (
        <span className="input-error" role="alert">
          {errorMessage}
        </span>
      ) : helperText ? (
        <span className="input-hint">{helperText}</span>
      ) : null}
    </div>
  );
};
