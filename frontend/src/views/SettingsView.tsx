import React, { useState } from 'react';
import { PageHeading } from '../design-system/PageHeading';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Input } from '../design-system/Input';
import { Table, TableHeader, TableRow, TableCell } from '../design-system/Table';
import { Website, User } from '../types/audit';
import { createWebsite, deleteWebsite, verifyWebsite } from '../api/client';

interface SettingsViewProps {
  currentUser?: User | null;
  websites: Website[];
  activeWebsite?: Website | null;
  onSelectWebsite: (site: Website) => void;
  onRefreshWebsites: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  websites,
  activeWebsite,
  onSelectWebsite,
  onRefreshWebsites,
  onOpenAuth,
  onLogout,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setSubmitting(true);
    setAddError(null);
    try {
      const site = await createWebsite(newUrl, newName || undefined, 'General');
      setNewUrl('');
      setNewName('');
      onRefreshWebsites();
      onSelectWebsite(site);
    } catch (err: any) {
      setAddError(err.message || 'Failed to register website.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!window.confirm('Are you sure you want to delete this website? All audit history and analytics will be permanently removed.')) {
      return;
    }
    try {
      await deleteWebsite(siteId);
      onRefreshWebsites();
    } catch (err: any) {
      alert(`Could not delete website: ${err.message}`);
    }
  };

  const handleVerify = async (siteId: string) => {
    setVerifying(true);
    setVerifyStatus('Checking domain ownership verification...');
    try {
      const res = await verifyWebsite(siteId);
      setVerifyStatus(res.message);
      onRefreshWebsites();
    } catch (err: any) {
      setVerifyStatus(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
      <PageHeading
        eyebrow="CONFIGURATION & DOMAINS"
        title="Settings & Website Management"
        subtitle="Manage registered properties, domain verification tokens, tracking snippets, and platform account access."
      />

      {/* Account Status Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-forest)' }}>
            USER ACCOUNT
          </span>
          <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: 'var(--space-1) 0 0 0' }}>
            {currentUser ? currentUser.email : 'Anonymous Workspace Session'}
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: '4px 0 0 0' }}>
            {currentUser
              ? `Signed in as ${currentUser.full_name || currentUser.email}. Multi-website synchronization active.`
              : 'Sign in to access persistent multi-website workspaces and continuous alerts.'}
          </p>
        </div>

        <div>
          {currentUser ? (
            <Button variant="outline" size="sm" onClick={onLogout}>
              Sign Out
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onOpenAuth}>
              Sign In or Register
            </Button>
          )}
        </div>
      </div>

      {/* Website Registry Table */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: 0 }}>
              Registered Websites ({websites.length})
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: '4px 0 0 0' }}>
              Switch the active property for audits, performance benchmarks, and visitor tracking.
            </p>
          </div>
        </div>

        {websites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-charcoal-muted)', fontSize: 'var(--text-xs)' }}>
            No websites registered yet. Add your first website below.
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <TableHeader>Website</TableHeader>
                <TableHeader>Verification</TableHeader>
                <TableHeader align="right">AI Readiness</TableHeader>
                <TableHeader align="right">Performance</TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {websites.map((w) => {
                const isActive = activeWebsite?.id === w.id;
                return (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>{w.name}</div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>{w.canonical_url}</div>
                        </div>
                        {isActive && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {w.is_verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="medium">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {w.latest_readiness_score !== null && w.latest_readiness_score !== undefined ? (
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: w.latest_readiness_score >= 75 ? 'var(--color-success)' : 'var(--color-critical)' }}>
                          {Math.round(w.latest_readiness_score)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {w.latest_performance_score !== null && w.latest_performance_score !== undefined ? (
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>
                          {Math.round(w.latest_performance_score)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        {!isActive && (
                          <Button variant="outline" size="sm" onClick={() => onSelectWebsite(w)}>
                            Select
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(w.id)} style={{ color: 'var(--color-critical)' }}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}

        {/* Add Website Form */}
        <form onSubmit={handleAddWebsite} style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-5)' }}>
          <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-forest)', margin: '0 0 var(--space-3) 0' }}>
            Register New Website
          </h4>

          {addError && (
            <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-critical-bg)', color: 'var(--color-critical)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>
              {addError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <Input
              label="Website URL"
              type="text"
              required
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />

            <Input
              label="Display Name (Optional)"
              type="text"
              placeholder="Acme Corp"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <div>
              <Button variant="primary" type="submit" fullWidth disabled={submitting}>
                {submitting ? 'Registering...' : 'Add Website'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Active Website Verification & Setup Wizard */}
      {activeWebsite && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-forest)' }}>
                OWNERSHIP VERIFICATION
              </span>
              <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: 'var(--space-1) 0 0 0' }}>
                Domain Verification for {activeWebsite.domain}
              </h3>
            </div>

            <div>
              {activeWebsite.is_verified ? (
                <Badge variant="success">Ownership Verified</Badge>
              ) : (
                <Button variant="primary" size="sm" onClick={() => handleVerify(activeWebsite.id)} disabled={verifying}>
                  {verifying ? 'Checking...' : 'Verify Ownership Now'}
                </Button>
              )}
            </div>
          </div>

          {verifyStatus && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-ivory-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
              {verifyStatus}
            </div>
          )}

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal-muted)', margin: '0 0 var(--space-4) 0' }}>
            Choose either method below to verify ownership and unlock real-time visitor analytics:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Method A: HTML File */}
            <div style={{ backgroundColor: 'var(--color-ivory-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                Method A: Upload Verification File
              </div>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', margin: '0 0 var(--space-2) 0' }}>
                Create a file containing your verification token and upload it to:
              </p>
              <code style={{ display: 'block', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: '2px', fontSize: 'var(--text-2xs)', wordBreak: 'break-all', marginBottom: 'var(--space-3)' }}>
                {activeWebsite.canonical_url}/.well-known/canopy-verification.txt
              </code>
              <Button variant="outline" size="sm" onClick={() => handleCopy(activeWebsite.verification_token)}>
                {copiedToken ? 'Token Copied!' : 'Copy Verification Token'}
              </Button>
            </div>

            {/* Method B: DNS TXT */}
            <div style={{ backgroundColor: 'var(--color-ivory-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                Method B: DNS TXT Record
              </div>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', margin: '0 0 var(--space-2) 0' }}>
                Add the following TXT record to your DNS zone for <strong>{activeWebsite.domain}</strong>:
              </p>
              <code style={{ display: 'block', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: '2px', fontSize: 'var(--text-2xs)', wordBreak: 'break-all', marginBottom: 'var(--space-3)' }}>
                canopy-verification={activeWebsite.verification_token}
              </code>
              <Button variant="outline" size="sm" onClick={() => handleCopy(`canopy-verification=${activeWebsite.verification_token}`)}>
                Copy DNS TXT Value
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
