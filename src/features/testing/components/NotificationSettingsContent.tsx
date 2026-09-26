import React, { useEffect, useState } from 'react';
import {
  Bell, Mail, Plus, Trash2, Save, Send,
  CheckCircle2, AlertTriangle, Info, Loader2, HardDrive,
} from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import Checkbox from '../../../shared/components/ui/Checkbox';
import DeleteConfirmModal from '../../../shared/components/ui/DeleteConfirmModal';
import { useToast } from '../../../contexts/ToastContext';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import {
  useArtifactRetention,
  useNotificationSettings,
  usePurgeArtifacts,
  useSendConfiguredNotification,
  useSendTestNotification,
  useUpdateNotificationSettings,
} from '../hooks/useHealthStatus';
import type {
  ArtifactPurgeResult,
  NotificationDeliveryResult,
  NotificationSettings,
} from '../types/health';
import {
  formatDeliverySuccess,
  formatNotificationError,
  isSmtpConfigured,
  smtpReadinessLabel,
} from '../utils/notificationUtils';

interface NotificationSettingsContentProps {
  onCancel?: () => void;
  showCancel?: boolean;
}

function formatPurgeSummary(result: ArtifactPurgeResult): string {
  const action = result.dryRun ? 'would be purged' : 'purged';
  return `${result.purged} folder(s) ${action} · ${result.scanned} scanned · ${result.skipped} skipped`;
}

const NotificationSettingsContent: React.FC<NotificationSettingsContentProps> = ({
  onCancel,
  showCancel = false,
}) => {
  const toast = useToast();
  const { data: existing, isLoading } = useNotificationSettings();
  const { data: retention, isLoading: retentionLoading } = useArtifactRetention();
  const purgeMutation = usePurgeArtifacts();
  const saveMutation = useUpdateNotificationSettings();
  const testMutation = useSendTestNotification();
  const broadcastMutation = useSendConfiguredNotification();

  const [form, setForm] = useState<NotificationSettings>({
    enabled: false,
    recipients: [],
  });
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Playwright Health SMTP test');
  const [testMessage, setTestMessage] = useState(
    'If you receive this, notification delivery is working.',
  );
  const [broadcastSubject, setBroadcastSubject] = useState('Manual Playwright Health alert');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Example operational notification from the Health Check dashboard.',
  );
  const [lastDelivery, setLastDelivery] = useState<NotificationDeliveryResult | null>(null);
  const [purgePreview, setPurgePreview] = useState<ArtifactPurgeResult | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const delivery = existing?.delivery;
  const smtpStatus = smtpReadinessLabel(delivery);
  const smtpReady = isSmtpConfigured(delivery);

  useEffect(() => {
    if (existing) {
      setForm({ enabled: existing.enabled, recipients: existing.recipients });
    }
  }, [existing]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const addRecipient = () => {
    const trimmed = newEmail.trim();
    if (!isValidEmail(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    if (form.recipients.includes(trimmed)) {
      setEmailError('Already in the list');
      return;
    }
    setForm((prev) => ({ ...prev, recipients: [...prev.recipients, trimmed] }));
    setNewEmail('');
    setEmailError('');
  };

  const removeRecipient = (email: string) => {
    setForm((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((item) => item !== email),
    }));
  };

  const handleSave = async () => {
    if (form.enabled && form.recipients.length === 0) {
      toast.error('Recipients required', 'Add at least one recipient before enabling alerts.');
      return;
    }
    try {
      await saveMutation.mutateAsync(form);
      toast.success('Settings saved', 'Notification preferences were updated.');
    } catch (err) {
      toast.error('Save failed', formatNotificationError(err));
    }
  };

  const handleTest = async () => {
    const trimmed = testEmail.trim();
    const useOverride = trimmed.length > 0;

    if (useOverride && !isValidEmail(trimmed)) {
      toast.error('Invalid email', 'Enter a valid test recipient or leave blank to use saved recipients.');
      return;
    }

    if (!useOverride && form.recipients.length === 0) {
      toast.error('No recipients', 'Enter a test email or add recipients to notification settings.');
      return;
    }

    try {
      const result = await testMutation.mutateAsync({
        ...(useOverride ? { recipients: [trimmed] } : {}),
        subject: testSubject.trim() || undefined,
        message: testMessage.trim() || undefined,
      });
      setLastDelivery(result);
      toast.success('Test delivered', formatDeliverySuccess(result));
    } catch (err) {
      toast.error('Send failed', formatNotificationError(err));
    }
  };

  const handleBroadcast = async () => {
    if (!form.enabled) {
      toast.error('Alerts disabled', 'Enable email alerts before sending to configured recipients.');
      return;
    }
    if (form.recipients.length === 0) {
      toast.error('No recipients', 'Add at least one recipient to notification settings.');
      return;
    }

    try {
      const result = await broadcastMutation.mutateAsync({
        subject: broadcastSubject.trim() || undefined,
        message: broadcastMessage.trim() || undefined,
      });
      setLastDelivery(result);
      toast.success('Notification delivered', formatDeliverySuccess(result));
    } catch (err) {
      toast.error('Send failed', formatNotificationError(err));
    }
  };

  const handleDryRunPurge = async () => {
    try {
      const result = await purgeMutation.mutateAsync({ dryRun: true });
      setPurgePreview(result);
      toast.success('Dry run complete', formatPurgeSummary(result));
    } catch (err) {
      toast.error('Dry run failed', (err as Error)?.message ?? 'Could not preview artifact purge.');
    }
  };

  const handleConfirmPurge = async () => {
    try {
      const result = await purgeMutation.mutateAsync({ dryRun: false });
      setPurgePreview(result);
      setShowPurgeConfirm(false);
      toast.success('Purge complete', formatPurgeSummary(result));
    } catch (err) {
      toast.error('Purge failed', (err as Error)?.message ?? 'Could not purge run artifacts.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <HardDrive size={18} className="text-gray-500" />
          Run artifact retention
        </h2>
        <p className="text-sm text-gray-500">
          Playwright reports, screenshots, and traces are stored on the server. Retention is
          configured via environment variables; use purge to remove expired folders immediately.
        </p>

        {retentionLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading retention policy…
          </div>
        ) : retention ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
              <dd className="mt-0.5 text-gray-900">{retention.enabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Retention</dt>
              <dd className="mt-0.5 text-gray-900">{retention.retentionDays} days</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Scheduled purge</dt>
              <dd className="mt-0.5 text-gray-900 font-mono text-xs">{retention.purgeCron}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Batch size</dt>
              <dd className="mt-0.5 text-gray-900">{retention.batchSize}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-gray-500">Could not load retention policy from the server.</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handleDryRunPurge}
            disabled={purgeMutation.isPending || !retention?.enabled}
            className={`${tw.button} inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60`}
          >
            {purgeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            Preview purge (dry run)
          </button>
          <button
            type="button"
            onClick={() => setShowPurgeConfirm(true)}
            disabled={purgeMutation.isPending || !retention?.enabled}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-rose-200 rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            Purge expired artifacts
          </button>
        </div>

        {!retention?.enabled && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Automatic retention is disabled on the server. Set{' '}
            <code className="text-xs">PLAYWRIGHT_ARTIFACTS_RETENTION_ENABLED=true</code> in the backend{' '}
            <code className="text-xs">.env</code>.
          </p>
        )}

        {purgePreview && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm space-y-2">
            <p className="font-medium text-gray-900">
              {purgePreview.dryRun ? 'Dry run result' : 'Purge result'}
            </p>
            <p className="text-gray-600">{formatPurgeSummary(purgePreview)}</p>
            <p className="text-xs text-gray-500">
              Cutoff: {new Date(purgePreview.cutoffAt).toLocaleString()}
            </p>
            {purgePreview.deletedDirs.length > 0 && (
              <ul className="text-xs text-gray-600 list-disc pl-4 max-h-32 overflow-y-auto">
                {purgePreview.deletedDirs.map((dir) => (
                  <li key={dir} className="font-mono break-all">{dir}</li>
                ))}
              </ul>
            )}
            {purgePreview.errors.length > 0 && (
              <p className="text-xs text-rose-600">
                {purgePreview.errors.length} error(s) during purge — check server logs.
              </p>
            )}
          </div>
        )}
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell size={18} className="text-gray-500" />
          SMTP delivery
        </h2>
        <p className="text-sm text-gray-500">
          Email delivery is handled by the Playwright Health service. Configure SMTP in the backend{' '}
          <code className="text-xs">.env</code> — settings below only control who receives alerts.
        </p>

        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            smtpStatus.ready
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {smtpStatus.ready ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-medium">{smtpStatus.label}</p>
              {delivery && (
                <ul className="text-xs space-y-0.5 opacity-90">
                  <li>Primary SMTP: {delivery.primaryConfigured ? 'configured' : 'missing'}</li>
                  <li>Fallback (Mailtrap): {delivery.fallbackConfigured ? 'configured' : 'missing'}</li>
                </ul>
              )}
              {smtpStatus.hint && <p className="text-xs opacity-90">{smtpStatus.hint}</p>}
            </div>
          </div>
        </div>

        {lastDelivery && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm space-y-1">
            <p className="font-medium text-gray-900">Last delivery</p>
            <p className="text-gray-600">{formatDeliverySuccess(lastDelivery)}</p>
            <p className="text-xs text-gray-500 font-mono truncate" title={lastDelivery.messageId}>
              Message ID: {lastDelivery.messageId}
            </p>
          </div>
        )}
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">Email notifications</h2>

        <div
          className="inline-flex items-start gap-2 cursor-pointer"
          onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
        >
          <Checkbox
            id="global-notify-enabled"
            checked={form.enabled}
            onChange={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
          />
          <div>
            <span className="text-sm font-medium text-gray-800">Enable email alerts</span>
            <p className="text-xs text-gray-500">Send alerts when health checks fail globally</p>
          </div>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail size={18} className="text-gray-500" />
          Recipients
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient emails
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <Input
                type="email"
                placeholder="engineer@company.com"
                value={newEmail}
                onChange={(value) => {
                  setNewEmail(String(value));
                  if (emailError) setEmailError('');
                }}
                hasError={!!emailError}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addRecipient();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={addRecipient}
              className={`${tw.button} inline-flex items-center gap-1 px-4 py-2 text-sm shrink-0`}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
          {!emailError && form.recipients.length === 0 && (
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Add at least one recipient to enable notifications
            </p>
          )}
        </div>

        {form.recipients.length > 0 && (
          <div className="flex flex-col gap-2">
            {form.recipients.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
              >
                <span className="text-sm text-gray-800">{email}</span>
                <button
                  type="button"
                  onClick={() => removeRecipient(email)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${email}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Send size={18} className="text-gray-500" />
          Send test email
        </h2>
        <p className="text-sm text-gray-500">
          Verifies SMTP delivery. Leave recipient blank to use saved notification recipients.
        </p>

        <Input
          label="Recipient (optional)"
          type="email"
          placeholder={form.recipients[0] ?? 'recipient@company.com'}
          value={testEmail}
          onChange={(value) => setTestEmail(String(value))}
        />
        <Input
          label="Subject (optional)"
          placeholder="Playwright Health SMTP test"
          value={testSubject}
          onChange={(value) => setTestSubject(String(value))}
        />
        <Textarea
          label="Message (optional)"
          value={testMessage}
          onChange={setTestMessage}
          rows={3}
          placeholder="Custom message body…"
        />

        <button
          type="button"
          onClick={handleTest}
          disabled={testMutation.isPending || !smtpReady}
          className={`${tw.button} inline-flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-60`}
        >
          {testMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send test
            </>
          )}
        </button>

        {!smtpReady && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Configure SMTP on the server before sending test emails.
          </p>
        )}
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail size={18} className="text-gray-500" />
          Send to configured recipients
        </h2>
        <p className="text-sm text-gray-500">
          Uses <code className="text-xs">POST /v1/notifications/send</code> with all saved recipients.
          Requires alerts to be enabled.
        </p>

        <Input
          label="Subject (optional)"
          placeholder="Manual Playwright Health alert"
          value={broadcastSubject}
          onChange={(value) => setBroadcastSubject(String(value))}
        />
        <Textarea
          label="Message (optional)"
          value={broadcastMessage}
          onChange={setBroadcastMessage}
          rows={3}
          placeholder="Operational notification body…"
        />

        <button
          type="button"
          onClick={handleBroadcast}
          disabled={
            broadcastMutation.isPending ||
            !smtpReady ||
            !form.enabled ||
            form.recipients.length === 0
          }
          className={`${tw.button} inline-flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-60`}
        >
          {broadcastMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send to {form.recipients.length || 0} recipient(s)
            </>
          )}
        </button>

        {(!form.enabled || form.recipients.length === 0) && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Enable alerts and add recipients above before using broadcast send.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="transition-colors disabled:opacity-60"
            style={getButtonStyles(button.bordered)}
            disabled={saveMutation.isPending}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className={`${tw.button} inline-flex items-center gap-2 px-6 py-2 text-sm disabled:opacity-60`}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : saveMutation.isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save settings
            </>
          )}
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={showPurgeConfirm}
        onClose={() => setShowPurgeConfirm(false)}
        onConfirm={handleConfirmPurge}
        title="Purge expired artifacts"
        description="This permanently deletes Playwright report and artifact folders older than the retention policy. This cannot be undone."
        itemName={`${retention?.retentionDays ?? 30}-day retention cutoff`}
        isLoading={purgeMutation.isPending}
        confirmText="Purge now"
        variant="warning"
      />
    </div>
  );
};

export default NotificationSettingsContent;
