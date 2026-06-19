import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Info } from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import Checkbox from '../../../shared/components/ui/Checkbox';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import TestSuitePicker from './TestSuitePicker';
import { CRON_PRESETS, validateCron } from '../utils/cronUtils';
import type { ModuleConfig } from '../types/health';

interface ModuleFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<ModuleConfig>;
  onSubmit: (payload: Partial<ModuleConfig>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  mode = 'create',
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel,
  submittingLabel,
}) => {
  const isEdit = mode === 'edit';
  const resolvedSubmitLabel = submitLabel ?? (isEdit ? 'Save Changes' : 'Create Module');
  const resolvedSubmittingLabel = submittingLabel ?? (isEdit ? 'Saving…' : 'Creating…');

  const initialCron = initialValues?.cron ?? '0 */6 * * *';
  const initialIsCustomCron = !CRON_PRESETS.some((preset) => preset.value === initialCron);

  const [id, setId] = useState(initialValues?.id ?? '');
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [selectedSuites, setSelectedSuites] = useState<string[]>(initialValues?.testSuites ?? []);
  const [cron, setCron] = useState(initialIsCustomCron ? '0 */6 * * *' : initialCron);
  const [customCron, setCustomCron] = useState(initialCron);
  const [isCustomCron, setIsCustomCron] = useState(initialIsCustomCron);
  const [baseUrl, setBaseUrl] = useState(initialValues?.baseUrl ?? window.location.origin);
  const [active, setActive] = useState(initialValues?.active ?? true);
  const [notifyOnFailure, setNotifyOnFailure] = useState(initialValues?.notifyOnFailure ?? true);
  const [notifyEmails, setNotifyEmails] = useState<string[]>(initialValues?.notifyEmails ?? []);
  const [newEmail, setNewEmail] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialValues) return;
    const nextCron = initialValues.cron ?? '0 */6 * * *';
    const nextIsCustom = !CRON_PRESETS.some((preset) => preset.value === nextCron);

    setId(initialValues.id ?? '');
    setName(initialValues.name ?? '');
    setDescription(initialValues.description ?? '');
    setSelectedSuites(initialValues.testSuites ?? []);
    setCron(nextIsCustom ? '0 */6 * * *' : nextCron);
    setCustomCron(nextCron);
    setIsCustomCron(nextIsCustom);
    setBaseUrl(initialValues.baseUrl ?? window.location.origin);
    setActive(initialValues.active ?? true);
    setNotifyOnFailure(initialValues.notifyOnFailure ?? true);
    setNotifyEmails(initialValues.notifyEmails ?? []);
  }, [initialValues]);

  const effectiveCron = isCustomCron ? customCron : cron;

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleCronPreset = (value: string) => {
    setIsCustomCron(false);
    setCron(value);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.cron;
      return next;
    });
  };

  const handleAddEmail = () => {
    const trimmed = newEmail.trim();
    if (!isValidEmail(trimmed)) {
      setErrors((prev) => ({ ...prev, email: 'Enter a valid email address' }));
      return;
    }
    if (notifyEmails.includes(trimmed)) {
      setErrors((prev) => ({ ...prev, email: 'Already in the list' }));
      return;
    }
    setNotifyEmails((prev) => [...prev, trimmed]);
    setNewEmail('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
  };

  const handleRemoveEmail = (email: string) => {
    setNotifyEmails((prev) => prev.filter((item) => item !== email));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!isEdit && !id.trim()) nextErrors.id = 'Module ID is required';
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (selectedSuites.length === 0) {
      nextErrors.testSuites = 'Select at least one test suite';
    }

    const cronErr = validateCron(effectiveCron);
    if (cronErr) nextErrors.cron = cronErr;

    if (!baseUrl.trim()) {
      nextErrors.baseUrl = 'Base URL is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    await onSubmit({
      ...(isEdit ? {} : { id: id.trim() }),
      name: name.trim(),
      description: description.trim(),
      testSuites: selectedSuites,
      cron: effectiveCron,
      baseUrl: baseUrl.trim(),
      notifyOnFailure,
      notifyEmails: notifyOnFailure ? notifyEmails : [],
      active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Identity</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Input
              label="ID (slug)*"
              placeholder="my-module-slug"
              value={id}
              onChange={(value) => {
                setId(value.replace(/\s+/g, '-').toLowerCase());
                if (errors.id) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.id;
                    return next;
                  });
                }
              }}
              hasError={!!errors.id}
              disabled={isEdit}
            />
            {errors.id ? (
              <p className="mt-1 text-xs text-red-500">{errors.id}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                {isEdit
                  ? 'Module ID cannot be changed after creation.'
                  : 'Unique lowercase identifier used in API URLs.'}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Name*"
              placeholder="My Module"
              value={name}
              onChange={(value) => {
                setName(value);
                if (errors.name) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              hasError={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Description"
              placeholder="Short description"
              value={description}
              onChange={setDescription}
              rows={2}
            />
          </div>

          <div className="md:col-span-2">
            <TestSuitePicker selected={selectedSuites} onChange={setSelectedSuites} />
            {errors.testSuites ? (
              <p className="mt-1 text-xs text-red-500">{errors.testSuites}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Select folders, spec files, or individual test cases from the live catalog.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Input
              label="Base URL*"
              placeholder="https://example.com"
              value={baseUrl}
              onChange={(value) => {
                setBaseUrl(value);
                if (errors.baseUrl) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.baseUrl;
                    return next;
                  });
                }
              }}
              hasError={!!errors.baseUrl}
            />
            {errors.baseUrl && <p className="mt-1 text-xs text-red-500">{errors.baseUrl}</p>}
          </div>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CRON_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleCronPreset(preset.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                !isCustomCron && cron === preset.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsCustomCron(true);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.cron;
                return next;
              });
            }}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              isCustomCron
                ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            Custom
          </button>
        </div>

        {isCustomCron && (
          <div className="mt-4">
            <Input
              label="Custom cron expression"
              placeholder="*/5 * * * *"
              value={customCron}
              onChange={(value) => {
                setCustomCron(value);
                const cronErr = validateCron(value);
                setErrors((prev) => {
                  const next = { ...prev };
                  if (cronErr) next.cron = cronErr;
                  else delete next.cron;
                  return next;
                });
              }}
              hasError={!!errors.cron}
            />
            {errors.cron ? (
              <p className="mt-1 text-xs text-red-500">{errors.cron}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">min · hour · day · month · weekday</p>
            )}
          </div>
        )}
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">Status &amp; Notifications</h2>

        <div className="space-y-4">
          <div
            className="inline-flex items-start gap-2 cursor-pointer"
            onClick={() => setActive(!active)}
          >
            <Checkbox
              id="module-active"
              checked={active}
              onChange={() => setActive(!active)}
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Enable module</span>
              <p className="text-xs text-gray-500">Scheduled runs start immediately when enabled</p>
            </div>
          </div>

          <div
            className="inline-flex items-start gap-2 cursor-pointer"
            onClick={() => setNotifyOnFailure(!notifyOnFailure)}
          >
            <Checkbox
              id="module-notify"
              checked={notifyOnFailure}
              onChange={() => setNotifyOnFailure(!notifyOnFailure)}
            />
            <div>
              <span className="text-sm font-medium text-gray-800">Alert on failure</span>
              <p className="text-xs text-gray-500">Send email when a run fails</p>
            </div>
          </div>
        </div>

        {notifyOnFailure && (
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
                    if (errors.email) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.email;
                        return next;
                      });
                    }
                  }}
                  hasError={!!errors.email}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddEmail}
                className={`${tw.button} inline-flex items-center gap-1 px-4 py-2 text-sm shrink-0`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}

            {notifyEmails.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {notifyEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <span className="text-sm text-gray-800">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
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
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="transition-colors disabled:opacity-60"
          style={getButtonStyles(button.bordered)}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`${tw.button} inline-flex items-center gap-2 px-6 py-2 text-sm`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {resolvedSubmittingLabel}
            </>
          ) : (
            resolvedSubmitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default ModuleForm;
