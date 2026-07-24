import React, { useState } from 'react';
import {
  Clock, Bell, Gauge, Plus, Trash2, Save, Loader2,
  CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Checkbox from '../../../shared/components/ui/Checkbox';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import { useUpdateSchedule } from '../hooks/useHealthStatus';
import { useToast } from '../../../contexts/ToastContext';
import TestSuitePicker from './TestSuitePicker';
import { CRON_PRESETS, validateCron, cronToHuman } from '../utils/cronUtils';
import type { ModuleStatus, ScheduleUpdate } from '../types/health';

const CRON_PRESET_OPTIONS = [
  ...CRON_PRESETS,
  { label: 'Custom', value: '__custom__' as const },
];

interface ScheduleFormContentProps {
  module: ModuleStatus;
  onCancel: () => void;
  onSaved?: () => void;
}

const ScheduleFormContent: React.FC<ScheduleFormContentProps> = ({
  module,
  onCancel,
  onSaved,
}) => {
  const updateSchedule = useUpdateSchedule();
  const toast = useToast();

  const isPreset = CRON_PRESETS.some((preset) => preset.value === module.cron);

  const [cron, setCron] = useState(isPreset ? module.cron : '0 */6 * * *');
  const [customCron, setCustomCron] = useState(module.cron);
  const [isCustom, setIsCustom] = useState(!isPreset);
  const [active, setActive] = useState(module.active);
  const [notifyOnFailure, setNotifyOnFailure] = useState(module.notifyOnFailure);
  const [notifyEmails, setNotifyEmails] = useState<string[]>(module.notifyEmails ?? []);
  const [selectedSuites, setSelectedSuites] = useState<string[]>(module.testSuites ?? []);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [perfThreshold, setPerfThreshold] = useState(module.thresholds?.performanceMs ?? 2000);
  const [maxFailures, setMaxFailures] = useState(module.thresholds?.maxFailures ?? 3);
  const [cronError, setCronError] = useState<string | null>(null);

  const effectiveCron = isCustom ? customCron : cron;

  const handleCronPreset = (value: string) => {
    if (value === '__custom__') {
      setIsCustom(true);
      setCronError(validateCron(customCron));
      return;
    }
    setIsCustom(false);
    setCron(value);
    setCronError(null);
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const addEmail = () => {
    const trimmed = newEmail.trim();
    if (!isValidEmail(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    if (notifyEmails.includes(trimmed)) {
      setEmailError('Already in the list');
      return;
    }
    setNotifyEmails((prev) => [...prev, trimmed]);
    setNewEmail('');
    setEmailError('');
  };

  const handleSave = async () => {
    const err = validateCron(effectiveCron);
    if (err) {
      setCronError(err);
      return;
    }
    // Test suites are optional — a module can be saved with none (e.g. it exists only as a
    // baseUrl namespace for dynamic API/UI test cases), so scheduled runs simply no-op until
    // suites are attached.

    const payload: ScheduleUpdate = {
      cron: effectiveCron,
      active,
      testSuites: selectedSuites,
      notifyOnFailure,
      notifyEmails: notifyOnFailure ? notifyEmails : [],
      thresholds: { performanceMs: perfThreshold, maxFailures },
    };

    try {
      await updateSchedule.mutateAsync({ id: module.id, payload });
      toast.success('Saved', 'Schedule updated successfully.');
      onSaved?.();
    } catch (err) {
      toast.error('Save failed', (err as Error)?.message ?? 'See console for details.');
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">Module status</h2>
        <div
          className="inline-flex items-start gap-2 cursor-pointer"
          onClick={() => setActive(!active)}
        >
          <Checkbox
            id="schedule-module-active"
            checked={active}
            onChange={() => setActive(!active)}
          />
          <div>
            <span className="text-sm font-medium text-gray-800">Enable monitoring</span>
            <p className="text-xs text-gray-500">When disabled, scheduled runs are paused</p>
          </div>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock size={18} className="text-gray-500" />
          Schedule
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CRON_PRESET_OPTIONS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleCronPreset(preset.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                (!isCustom && cron === preset.value) ||
                (isCustom && preset.value === '__custom__')
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {isCustom && (
          <div>
            <Input
              label="Custom cron expression"
              placeholder="*/5 * * * *"
              value={customCron}
              onChange={(value) => {
                setCustomCron(String(value));
                setCronError(validateCron(String(value)));
              }}
              hasError={!!cronError}
            />
            {cronError ? (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {cronError}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">min · hour · day · month · weekday</p>
            )}
          </div>
        )}

        {!cronError && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} />
            {cronToHuman(effectiveCron)}
          </div>
        )}
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-3`}>
        <h2 className="text-lg font-semibold text-gray-900">Test suites</h2>
        <TestSuitePicker selected={selectedSuites} onChange={setSelectedSuites} />
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Select folders, spec files, or individual test cases.
        </p>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell size={18} className="text-gray-500" />
          Notifications
        </h2>

        <div
          className="inline-flex items-start gap-2 cursor-pointer"
          onClick={() => setNotifyOnFailure(!notifyOnFailure)}
        >
          <Checkbox
            id="schedule-notify"
            checked={notifyOnFailure}
            onChange={() => setNotifyOnFailure(!notifyOnFailure)}
          />
          <div>
            <span className="text-sm font-medium text-gray-800">Alert on failure</span>
            <p className="text-xs text-gray-500">Send email when a run fails</p>
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
                    if (emailError) setEmailError('');
                  }}
                  hasError={!!emailError}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addEmail();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={addEmail}
                className={`${tw.button} inline-flex items-center gap-1 px-4 py-2 text-sm shrink-0`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}

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
                      onClick={() => setNotifyEmails((prev) => prev.filter((item) => item !== email))}
                      className="text-gray-400 hover:text-red-500"
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

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-5`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Gauge size={18} className="text-gray-500" />
          Thresholds
        </h2>

        <div>
          <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Performance threshold</span>
            <span className="font-mono text-blue-600">{perfThreshold.toLocaleString()}ms</span>
          </label>
          <input
            type="range"
            min={500}
            max={10000}
            step={100}
            value={perfThreshold}
            onChange={(event) => setPerfThreshold(Number(event.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>500ms</span>
            <span>10s</span>
          </div>
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Max consecutive failures before alert</span>
            <span className="font-mono text-blue-600">{maxFailures}</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={maxFailures}
            onChange={(event) => setMaxFailures(Number(event.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="transition-colors disabled:opacity-60"
          style={getButtonStyles(button.bordered)}
          disabled={updateSchedule.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateSchedule.isPending || !!cronError}
          className={`${tw.button} inline-flex items-center gap-2 px-6 py-2 text-sm disabled:opacity-60`}
        >
          {updateSchedule.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScheduleFormContent;
