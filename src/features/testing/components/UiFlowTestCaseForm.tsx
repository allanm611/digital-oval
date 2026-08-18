import React, { useEffect, useState } from 'react';
import {
  Play, Plus, Trash2, Save, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Clock, MousePointerClick, ArrowUp, ArrowDown, MinusCircle,
} from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Checkbox from '../../../shared/components/ui/Checkbox';
import ImageLightbox from '../../../shared/components/ui/ImageLightbox';
import { useToast } from '../../../contexts/ToastContext';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import { useCreateUiFlowTestCase, useTryUiFlowTestCase, useUpdateUiFlowTestCase } from '../hooks/useUiFlowTestCases';
import AttachModuleField from './AttachModuleField';
import type {
  UiFlowStep,
  UiFlowTestCase,
  UiFlowTestCasePayload,
  UiFlowTestCaseResult,
  UiStepAction,
} from '../types/health';

interface ModuleOption {
  id: string;
  name: string;
}

interface UiFlowTestCaseFormProps {
  moduleOptions: ModuleOption[];
  initialCase?: UiFlowTestCase | null;
  onSaved: (testCase: UiFlowTestCase) => void;
  onCancel: () => void;
}

const STEP_ACTIONS: UiStepAction[] = [
  'goto', 'click', 'fill', 'check', 'uncheck', 'selectOption', 'press',
  'waitForSelector', 'expectVisible', 'expectText', 'expectURL', 'expectCount',
];

const ACTION_LABELS: Record<UiStepAction, string> = {
  goto: 'Go to URL',
  click: 'Click',
  fill: 'Fill',
  check: 'Check',
  uncheck: 'Uncheck',
  selectOption: 'Select option',
  press: 'Press key',
  waitForSelector: 'Wait for selector',
  expectVisible: 'Assert visible',
  expectText: 'Assert text contains',
  expectURL: 'Assert URL contains',
  expectCount: 'Assert element count',
};

const NEEDS_LOCATOR: Record<UiStepAction, boolean> = {
  goto: false,
  click: true,
  fill: true,
  check: true,
  uncheck: true,
  selectOption: true,
  press: false,
  waitForSelector: true,
  expectVisible: true,
  expectText: true,
  expectURL: false,
  expectCount: true,
};

const NEEDS_VALUE: Record<UiStepAction, boolean> = {
  goto: true,
  click: false,
  fill: true,
  check: false,
  uncheck: false,
  selectOption: true,
  press: true,
  waitForSelector: true,
  expectVisible: false,
  expectText: true,
  expectURL: true,
  expectCount: false,
};

const NEEDS_COUNT: Record<UiStepAction, boolean> = {
  goto: false, click: false, fill: false, check: false, uncheck: false,
  selectOption: false, press: false, waitForSelector: false, expectVisible: false,
  expectText: false, expectURL: false, expectCount: true,
};

const VALUE_LABEL: Partial<Record<UiStepAction, string>> = {
  goto: 'URL or path (e.g. /login)',
  fill: 'Text to fill',
  selectOption: 'Option value',
  press: 'Key (e.g. Enter, Escape)',
  waitForSelector: 'State (visible/hidden/attached/detached)',
  expectText: 'Expected text (substring)',
  expectURL: 'Expected URL substring',
};

const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';

function newStep(): UiFlowStep {
  return { action: 'click', locator: '' };
}

const StepEditor: React.FC<{
  steps: UiFlowStep[];
  onChange: (steps: UiFlowStep[]) => void;
}> = ({ steps, onChange }) => {
  const update = (index: number, patch: Partial<UiFlowStep>) =>
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {steps.length === 0 ? (
        <p className="text-xs text-gray-400">No steps yet — add at least one action below.</p>
      ) : (
        steps.map((step, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 w-5 shrink-0">{index + 1}.</span>
              <select
                className={`${selectClass} flex-1`}
                value={step.action}
                onChange={(e) => update(index, { action: e.target.value as UiStepAction })}
              >
                {STEP_ACTIONS.map((action) => (
                  <option key={action} value={action}>{ACTION_LABELS[action]}</option>
                ))}
              </select>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move up">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === steps.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move down">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => onChange(steps.filter((_, i) => i !== index))} className="p-1 text-gray-400 hover:text-red-500" aria-label="Remove step">
                <Trash2 size={14} />
              </button>
            </div>

            {NEEDS_LOCATOR[step.action] && (
              <>
                <Input
                  variant="compact"
                  placeholder='Exactly ONE locator — e.g. role=button[name="Submit"] (see format hint below)'
                  value={step.locator ?? ''}
                  onChange={(value) => update(index, { locator: String(value) })}
                />
                <p className="text-xs text-gray-400">
                  Pick one format: role=&lt;role&gt;[name=&quot;...&quot;] · label=&lt;text&gt; · placeholder=&lt;text&gt; ·
                  text=&lt;text&gt; · testid=&lt;id&gt; · alt=&lt;text&gt; · title=&lt;text&gt; · css=&lt;selector&gt;.
                  Don&apos;t combine several of these with commas — that&apos;s not a valid locator.
                </p>
              </>
            )}
            {NEEDS_VALUE[step.action] && (
              <Input
                variant="compact"
                placeholder={VALUE_LABEL[step.action] ?? 'Value'}
                value={step.value ?? ''}
                onChange={(value) => update(index, { value: String(value) })}
              />
            )}
            {NEEDS_COUNT[step.action] && (
              <Input
                variant="compact"
                type="number"
                placeholder="Expected element count"
                value={step.count ?? 0}
                onChange={(value) => update(index, { count: Number(value) || 0 })}
              />
            )}
            <Input
              variant="compact"
              placeholder="Description (optional, shown in run reports)"
              value={step.description ?? ''}
              onChange={(value) => update(index, { description: String(value) })}
            />
          </div>
        ))
      )}
      <button
        type="button"
        onClick={() => onChange([...steps, newStep()])}
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
      >
        <Plus size={12} /> Add step
      </button>
    </div>
  );
};

const TryResultPanel: React.FC<{
  result: UiFlowTestCaseResult;
  onScreenshotClick: (screenshotIndex: number) => void;
}> = ({ result, onScreenshotClick }) => {
  // Maps each step's own index to its position within the ordered list of steps that actually
  // have a screenshot, so the lightbox can navigate across just those (skipping steps without one).
  const shotPositionByStepIndex = new Map(
    result.steps.filter((s) => s.screenshotBase64).map((s, position) => [s.index, position]),
  );

  return (
  <div
    className={`rounded-lg border p-4 space-y-3 ${
      result.ok ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {result.ok ? (
          <CheckCircle2 size={16} className="text-emerald-600" />
        ) : (
          <XCircle size={16} className="text-rose-600" />
        )}
        <span className={`text-sm font-semibold ${result.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
          {result.ok ? 'Flow completed successfully' : 'Flow failed'}
        </span>
      </div>
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Clock size={12} /> {result.durationMs}ms
      </span>
    </div>
    {result.error && (
      <p className="text-xs text-rose-700 bg-white rounded px-2 py-1 font-mono">{result.error}</p>
    )}
    <ul className="space-y-2">
      {result.steps.map((stepResult) => (
        <li key={stepResult.index} className="flex items-start gap-2 text-xs">
          {stepResult.skipped ? (
            <MinusCircle size={12} className="text-gray-400 shrink-0 mt-0.5" />
          ) : stepResult.passed ? (
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle size={12} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span
              className={
                stepResult.skipped
                  ? 'text-gray-400'
                  : stepResult.passed
                    ? 'text-emerald-800'
                    : 'text-rose-800'
              }
            >
              {ACTION_LABELS[stepResult.step.action]}
              {stepResult.step.locator ? ` · ${stepResult.step.locator}` : ''}
              {' — '}{stepResult.message}
            </span>
            {stepResult.screenshotBase64 && (
              <button
                type="button"
                onClick={() => onScreenshotClick(shotPositionByStepIndex.get(stepResult.index) ?? 0)}
                className="mt-1 block rounded border border-gray-200 hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100 transition-all cursor-zoom-in"
                aria-label={`View full-size screenshot after step ${stepResult.index + 1}`}
                title="Click to view full size"
              >
                <img
                  src={`data:image/jpeg;base64,${stepResult.screenshotBase64}`}
                  alt={`Screenshot after step ${stepResult.index + 1}`}
                  className="max-h-40 w-auto max-w-full rounded bg-white object-contain"
                />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
    <p className="text-[11px] text-gray-500">
      Blank or solid-color screenshots usually mean the page hadn&apos;t finished rendering,
      or the route requires login (headless browser starts with an empty session). Add login
      steps first, then assert a visible element before relying on the screenshot.
    </p>
  </div>
  );
};

const UiFlowTestCaseForm: React.FC<UiFlowTestCaseFormProps> = ({
  moduleOptions,
  initialCase = null,
  onSaved,
  onCancel,
}) => {
  const toast = useToast();
  const createMutation = useCreateUiFlowTestCase();
  const updateMutation = useUpdateUiFlowTestCase();
  const tryMutation = useTryUiFlowTestCase();

  const [name, setName] = useState(initialCase?.name ?? '');
  const [startUrl, setStartUrl] = useState(initialCase?.startUrl ?? '');
  const [moduleId, setModuleId] = useState(initialCase?.moduleId ?? '');
  const [steps, setSteps] = useState<UiFlowStep[]>(initialCase?.steps ?? []);
  const [timeoutMs, setTimeoutMs] = useState(initialCase?.timeoutMs ?? 30000);
  const [active, setActive] = useState(initialCase?.active ?? true);
  const [useStoredAuth, setUseStoredAuth] = useState(initialCase?.useStoredAuth ?? true);
  const [tryResult, setTryResult] = useState<UiFlowTestCaseResult | null>(null);
  const [formError, setFormError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxImages = (tryResult?.steps ?? [])
    .filter((stepResult) => stepResult.screenshotBase64)
    .map((stepResult) => ({
      src: `data:image/jpeg;base64,${stepResult.screenshotBase64}`,
      alt: `Screenshot after step ${stepResult.index + 1}`,
    }));

  useEffect(() => {
    setTryResult(null);
  }, [name, startUrl, moduleId, steps]);

  const buildPayload = (): UiFlowTestCasePayload | null => {
    const trimmedName = name.trim();
    const trimmedUrl = startUrl.trim();
    if (!trimmedName || !trimmedUrl) {
      setFormError('Name and start URL are required.');
      return null;
    }
    if (steps.length === 0) {
      setFormError('Add at least one step.');
      return null;
    }
    for (const step of steps) {
      if (NEEDS_LOCATOR[step.action] && !step.locator?.trim()) {
        setFormError(`"${ACTION_LABELS[step.action]}" steps require a locator.`);
        return null;
      }
      if (NEEDS_VALUE[step.action] && !step.value?.trim()) {
        setFormError(`"${ACTION_LABELS[step.action]}" steps require a value.`);
        return null;
      }
    }

    // Drop fields the current action doesn't use (e.g. a leftover locator
    // from before the user switched a step to "Assert URL contains") instead
    // of persisting empty/stale strings.
    const normalizedSteps: UiFlowStep[] = steps.map((step) => ({
      action: step.action,
      ...(NEEDS_LOCATOR[step.action] && step.locator?.trim() ? { locator: step.locator.trim() } : {}),
      ...(NEEDS_VALUE[step.action] && step.value?.trim() ? { value: step.value.trim() } : {}),
      ...(NEEDS_COUNT[step.action] && step.count !== undefined ? { count: step.count } : {}),
      ...(step.description?.trim() ? { description: step.description.trim() } : {}),
    }));

    setFormError('');
    return {
      moduleId: moduleId || null,
      name: trimmedName,
      startUrl: trimmedUrl,
      steps: normalizedSteps,
      timeoutMs,
      active,
      useStoredAuth,
      tags: initialCase?.tags ?? [],
    };
  };

  const handleTry = async () => {
    const payload = buildPayload();
    if (!payload) return;
    try {
      const result = await tryMutation.mutateAsync(
        initialCase ? { ...payload, id: initialCase.id } : payload,
      );
      setTryResult(result);
    } catch (err) {
      toast.error('Try failed', err instanceof Error ? err.message : 'Could not run the flow.');
    }
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    try {
      const saved = initialCase
        ? await updateMutation.mutateAsync({ id: initialCase.id, payload })
        : await createMutation.mutateAsync(payload);
      toast.success(
        initialCase ? 'Test case updated' : 'Test case created',
        `"${saved.name}" is ready to run — attach it to a module's test suites to schedule it.`,
      );
      onSaved(saved);
    } catch (err) {
      toast.error('Save failed', err instanceof Error ? err.message : 'Could not save the test case.');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MousePointerClick size={18} className="text-gray-500" />
          Flow
        </h2>

        <Input label="Name" value={name} onChange={(v) => setName(String(v))} placeholder="Login succeeds with valid credentials" />

        <Input
          label="Start URL"
          value={startUrl}
          onChange={(v) => setStartUrl(String(v))}
          placeholder="/login or https://app.example.com/login"
        />

        <AttachModuleField
          label="Attach to module (required for relative URLs — resolves against the module's baseUrl)"
          placeholderOptionLabel="— Standalone / reusable (absolute URLs only) —"
          moduleId={moduleId}
          moduleOptions={moduleOptions}
          onChange={setModuleId}
        />

        <Input
          label="Timeout per step (ms)"
          type="number"
          value={timeoutMs}
          onChange={(v) => setTimeoutMs(Number(v) || 30000)}
        />

        <div
          className="inline-flex items-start gap-2 cursor-pointer"
          onClick={() => setActive(!active)}
        >
          <Checkbox id="ui-flow-active" checked={active} onChange={() => setActive(!active)} />
          <div>
            <span className="text-sm font-medium text-gray-800">Active</span>
            <p className="text-xs text-gray-500">Inactive flows are hidden from the dynamic UI runner.</p>
          </div>
        </div>

        <div
          className="inline-flex items-start gap-2 cursor-pointer"
          onClick={() => setUseStoredAuth(!useStoredAuth)}
        >
          <Checkbox
            id="ui-flow-stored-auth"
            checked={useStoredAuth}
            onChange={() => setUseStoredAuth(!useStoredAuth)}
          />
          <div>
            <span className="text-sm font-medium text-gray-800">Use saved login session</span>
            <p className="text-xs text-gray-500">
              Reuses Playwright storageState from auth setup (TEST_EMAIL / TEST_PASSWORD).
              Turn off only when this flow should start logged-out and include its own login steps.
            </p>
          </div>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">Steps</h2>
        <p className="text-sm text-gray-500">
          Executed in order after navigating to the start URL. If a step fails, the rest are
          skipped — mirrors how a real user flow depends on each prior action. With
          <span className="font-medium"> Use saved login session</span> enabled, protected
          routes reuse the shared auth session (no login steps needed). After navigations,
          add <span className="font-medium">Assert visible</span> so the SPA finishes painting
          before you rely on screenshots.
        </p>
        <StepEditor steps={steps} onChange={setSteps} />
      </div>

      {formError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <AlertTriangle size={14} />
          {formError}
        </div>
      )}

      {tryResult && <TryResultPanel result={tryResult} onScreenshotClick={setLightboxIndex} />}

      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleTry}
          disabled={tryMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-indigo-200 rounded-md text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
        >
          {tryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {tryMutation.isPending ? 'Running in a real browser…' : 'Try now'}
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="transition-colors disabled:opacity-60"
            style={getButtonStyles(button.bordered)}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`${tw.button} inline-flex items-center gap-2 px-6 py-2 text-sm disabled:opacity-60`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {initialCase ? 'Save changes' : 'Create test case'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UiFlowTestCaseForm;
