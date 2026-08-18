import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import Checkbox from '../../../shared/components/ui/Checkbox';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import TestSuitePicker from './TestSuitePicker';
import { CRON_PRESETS, validateCron } from '../utils/cronUtils';
import type { ModuleConfig } from '../types/health';

/** Lowercase, hyphenated slug derived from a free-text name (e.g. for the module ID). */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ModuleFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<ModuleConfig>;
  onSubmit: (payload: Partial<ModuleConfig>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  /**
   * Trims the form for "quick attach" flows (e.g. creating a module inline from a test case
   * builder): test suites, schedule, and notifications collapse into an optional "Advanced
   * settings" section (with sensible defaults already applied) so only identity + base URL
   * are front-and-center. Nothing is removed — the same validated fields/logic are still used,
   * just progressively disclosed.
   */
  compact?: boolean;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  mode = 'create',
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel,
  submittingLabel,
  compact = false,
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
  // Tracks whether the user has typed directly into the ID field — once they have, stop
  // overwriting it from the auto-slug so manual overrides always win.
  const [idManuallyEdited, setIdManuallyEdited] = useState(isEdit || Boolean(initialValues?.id));
  // In compact mode, test suites / schedule / notifications start collapsed behind "Advanced
  // settings" since sensible defaults are already applied — expand on demand.
  const [showAdvanced, setShowAdvanced] = useState(!compact);

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
    // Test suites are optional: a module can exist purely as a baseUrl namespace for dynamic
    // API/UI test cases to attach to, with catalog suites added later once they exist.

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
              label="Name*"
              placeholder="My Module"
              value={name}
              onChange={(value) => {
                setName(value);
                if (!isEdit && !idManuallyEdited) {
                  setId(slugify(value));
                }
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

          <div>
            <Input
              label="ID (slug)*"
              placeholder="my-module-slug"
              value={id}
              onChange={(value) => {
                setIdManuallyEdited(true);
                setId(slugify(value));
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
                  : 'Auto-filled from Name — edit it directly to override.'}
              </p>
            )}
          </div>

          {!compact && (
            <div className="md:col-span-2">
              <Textarea
                label="Description"
                placeholder="Short description"
                value={description}
                onChange={setDescription}
                rows={2}
              />
            </div>
          )}

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

          {compact && !showAdvanced && (
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <ChevronRight className="w-4 h-4" />
                Advanced settings (test suites, schedule, notifications)
              </button>
              <p className="mt-1 text-xs text-gray-500">
                Optional — this module will be created with no test suites and a default
                schedule. Attach suites or tune the schedule any time from the Modules page.
              </p>
            </div>
          )}

          {showAdvanced && (
            <div className="md:col-span-2">
              {compact && (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(false)}
                  className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ChevronDown className="w-4 h-4" />
                  Hide advanced settings
                </button>
              )}
              <TestSuitePicker selected={selectedSuites} onChange={setSelectedSuites} />
              <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Optional — select folders, spec files, or individual test cases from the live
                catalog. Leave empty if this module only groups dynamic test cases for now.
              </p>
            </div>
          )}
        </div>
      </div>

      {showAdvanced && (
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
      )}

      {showAdvanced && (
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
      )}

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
