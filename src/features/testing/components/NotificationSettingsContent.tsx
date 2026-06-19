import React, { useEffect, useState } from 'react';
import {
  Bell, Mail, Plus, Trash2, Save, Send,
  CheckCircle2, AlertTriangle, Info, Loader2,
} from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import Checkbox from '../../../shared/components/ui/Checkbox';
import { useToast } from '../../../contexts/ToastContext';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../hooks/useHealthStatus';
import { sendTestNotification } from '../services/healthApi';
import type { NotificationSettings, NotificationSendPayload } from '../types/health';
import { useMutation } from '@tanstack/react-query';

interface NotificationSettingsContentProps {
  onCancel?: () => void;
  showCancel?: boolean;
}

const NotificationSettingsContent: React.FC<NotificationSettingsContentProps> = ({
  onCancel,
  showCancel = false,
}) => {
  const toast = useToast();
  const { data: existing, isLoading } = useNotificationSettings();
  const saveMutation = useUpdateNotificationSettings();

  const testMutation = useMutation({
    mutationFn: (payload: NotificationSendPayload) => sendTestNotification(payload),
  });

  const [form, setForm] = useState<NotificationSettings>({
    enabled: false,
    recipients: [],
  });
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Health-check alert test');
  const [testMessage, setTestMessage] = useState(
    'This is a test notification from the Playwright Health service.',
  );

  useEffect(() => {
    if (existing) setForm(existing);
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
    try {
      await saveMutation.mutateAsync(form);
      toast.success('Settings saved', 'Notification preferences were updated.');
    } catch (err) {
      toast.error('Save failed', (err as Error)?.message ?? 'Could not save notification settings.');
    }
  };

  const handleTest = async () => {
    if (!isValidEmail(testEmail)) return;
    try {
      await testMutation.mutateAsync({
        recipients: [testEmail.trim()],
        subject: testSubject || undefined,
        message: testMessage || undefined,
      });
      toast.success('Test queued', 'Check your inbox for the test email.');
    } catch (err) {
      toast.error('Send failed', (err as Error)?.message ?? 'Could not send test notification.');
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

        <Input
          label="Recipient"
          type="email"
          placeholder="recipient@company.com"
          value={testEmail}
          onChange={(value) => setTestEmail(String(value))}
        />
        <Input
          label="Subject (optional)"
          placeholder="Health-check alert test"
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
          disabled={testMutation.isPending || !isValidEmail(testEmail)}
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

        {!form.enabled && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Notifications are disabled — enable them above before sending alerts.
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
    </div>
  );
};

export default NotificationSettingsContent;
