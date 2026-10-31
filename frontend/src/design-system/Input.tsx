import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  hint?: string;
  errorMessage?: string;
  actionButton?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  hint,
  errorMessage,
  actionButton,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const resolvedHint = hint || helperText;

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
      ) : resolvedHint ? (
        <span className="input-hint">{resolvedHint}</span>
      ) : null}
    </div>
  );
};
