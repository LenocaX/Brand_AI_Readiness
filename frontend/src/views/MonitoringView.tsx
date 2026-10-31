import React, { useState, useEffect } from 'react';
import { PageHeading } from '../design-system/PageHeading';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { AlertItem, MonitoringConfig, Website } from '../types/audit';
import {
  getMonitoringConfig,
  updateMonitoringConfig,
  getWebsiteAlerts,
  markAlertRead,
  triggerHealthCheck,
} from '../api/client';

interface MonitoringViewProps {
  website?: Website | null;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ website }) => {
  const [config, setConfig] = useState<MonitoringConfig | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  const websiteId = website?.id;

  const loadData = async () => {
    if (!websiteId) return;
    setLoading(true);
    try {
      const [cfg, alt] = await Promise.all([
        getMonitoringConfig(websiteId),
        getWebsiteAlerts(websiteId, unreadOnly),
      ]);
      setConfig(cfg);
      setAlerts(alt);
    } catch (err) {
      console.warn('Could not load monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (websiteId) {
      loadData();
    }
  }, [websiteId, unreadOnly]);

  const handleToggleActive = async () => {
    if (!websiteId || !config) return;
    setSaving(true);
    try {
      await updateMonitoringConfig(websiteId, {
        frequency: config.frequency,
        is_active: !config.is_active,
        notify_email: config.notify_email || undefined,
      });
      setConfig((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeFrequency = async (freq: string) => {
    if (!websiteId || !config) return;
    setSaving(true);
    try {
      await updateMonitoringConfig(websiteId, {
        frequency: freq,
        is_active: config.is_active,
        notify_email: config.notify_email || undefined,
      });
      setConfig((prev) => (prev ? { ...prev, frequency: freq } : null));
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerCheck = async () => {
    if (!websiteId) return;
    setCheckStatus('Executing continuous health check...');
    try {
      const res = await triggerHealthCheck(websiteId);
      setCheckStatus(`Health check complete. ${res.alerts_generated} alert(s) generated.`);
      loadData();
    } catch (err: any) {
      setCheckStatus(`Check failed: ${err.message}`);
    }
  };

  const handleMarkRead = async (alertId: string) => {
    if (!websiteId) return;
    try {
      await markAlertRead(websiteId, alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      console.warn('Mark read failed:', err);
    }
  };

  if (!website) {
    return (
      <div style={{ maxWidth: '800px', margin: 'var(--space-8) auto', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'var(--color-surface-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--color-charcoal-muted)' }}>Select a registered website to configure continuous monitoring schedules and alert notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <PageHeading
          eyebrow="CONTINUOUS MONITORING"
          title={`Monitoring & Regression Alerts — ${website.name}`}
          subtitle="Automated periodic scans detecting AI crawler access disruptions, score regressions, broken links, and metadata deterioration."
        />

        <Button variant="primary" size="sm" onClick={handleTriggerCheck} disabled={loading}>
          Run Immediate Health Check
        </Button>
      </div>

      {checkStatus && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-ivory-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
          {checkStatus}
        </div>
      )}

      {/* Monitoring Schedule Control Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-forest)' }}>
              SCHEDULE CONFIGURATION
            </span>
            <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: 'var(--space-1) 0 0 0' }}>
              Automated Periodic Scan Schedule
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              Status: {config?.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="medium">Paused</Badge>}
            </span>
            <Button variant={config?.is_active ? 'outline' : 'primary'} size="sm" onClick={handleToggleActive} disabled={saving}>
              {config?.is_active ? 'Pause Monitoring' : 'Enable Monitoring'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)', marginBottom: 'var(--space-1)' }}>
              SCAN FREQUENCY
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {['daily', 'weekly', 'monthly'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleChangeFrequency(freq)}
                  style={{
                    padding: '4px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: config?.frequency === freq ? 'var(--color-forest)' : 'var(--color-ivory-light)',
                    color: config?.frequency === freq ? 'var(--color-ivory)' : 'var(--color-charcoal)',
                    fontSize: 'var(--text-xs)',
                    textTransform: 'capitalize',
                    fontWeight: config?.frequency === freq ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {config?.next_run_at && (
            <div>
              <span style={{ display: 'block', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)', marginBottom: 'var(--space-1)' }}>
                NEXT SCHEDULED SCAN
              </span>
              <span style={{ fontSize: 'var(--text-xs)' }}>
                {new Date(config.next_run_at).toLocaleString()}
              </span>
            </div>
          )}

          {config?.last_run_at && (
            <div>
              <span style={{ display: 'block', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--color-charcoal-muted)', marginBottom: 'var(--space-1)' }}>
                LAST COMPLETED SCAN
              </span>
              <span style={{ fontSize: 'var(--text-xs)' }}>
                {new Date(config.last_run_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts Feed */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 className="font-serif" style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Incident & Regression Alerts ({alerts.length})
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Show unread alerts only
          </label>
        </div>

        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-charcoal-muted)', fontSize: 'var(--text-xs)' }}>
            No monitoring alerts recorded. All scans are operating normally.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {alerts.map((alt) => (
              <div
                key={alt.id}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: alt.is_read ? 'var(--color-surface-white)' : 'var(--color-ivory-light)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `4px solid ${alt.severity === 'critical' ? 'var(--color-critical)' : alt.severity === 'high' ? 'var(--color-high)' : 'var(--color-medium)'}`,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Badge variant={alt.severity === 'critical' ? 'critical' : alt.severity === 'high' ? 'high' : 'medium'}>
                      {alt.severity}
                    </Badge>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-charcoal)' }}>
                      {alt.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)' }}>
                      {new Date(alt.created_at).toLocaleString()}
                    </span>
                    {!alt.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(alt.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-forest)', fontSize: 'var(--text-2xs)', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-charcoal)', margin: 'var(--space-1) 0' }}>
                  {alt.message}
                </p>

                {alt.evidence && (
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>
                    Evidence: {alt.evidence}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
