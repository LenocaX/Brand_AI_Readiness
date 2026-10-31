import React, { useState } from 'react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { registerUser, loginUser } from '../api/client';
import { User } from '../types/audit';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await registerUser(email, password, fullName);
        onSuccess(user);
        onClose();
      } else {
        const res = await loginUser(email, password);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? 'Create Canopy Account' : 'Sign in to Canopy'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-critical-bg)',
              border: '1px solid var(--color-critical-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-critical)',
              fontSize: 'var(--text-xs)',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            {error}
          </div>
        )}

        {isRegister && (
          <Input
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <Input
          label="Email Address"
          type="email"
          required
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          required
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={isRegister ? 'Must be at least 6 characters' : undefined}
        />

        <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button variant="primary" type="submit" fullWidth disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-forest)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textAlign: 'center',
            }}
          >
            {isRegister
              ? 'Already registered? Sign in here'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
