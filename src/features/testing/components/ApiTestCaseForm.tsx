import React, { useEffect, useState } from 'react';
import {
  Play, Plus, Trash2, Save, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Clock, Globe,
} from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import Checkbox from '../../../shared/components/ui/Checkbox';
import { useToast } from '../../../contexts/ToastContext';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import { useCreateApiTestCase, useTryApiTestCase, useUpdateApiTestCase } from '../hooks/useApiTestCases';
import AttachModuleField from './AttachModuleField';
import type {
  ApiAssertion,
  ApiAssertionOperator,
  ApiAssertionType,
  ApiTestCase,
  ApiTestCasePayload,
  ApiTestCaseResult,
  HttpMethod,
} from '../types/health';

interface ModuleOption {
  id: string;
  name: string;
}

interface ApiTestCaseFormProps {
  moduleOptions: ModuleOption[];
  initialCase?: ApiTestCase | null;
  onSaved: (testCase: ApiTestCase) => void;
  onCancel: () => void;
}

interface KeyValueRow {
  key: string;
  value: string;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
const ASSERTION_TYPES: ApiAssertionType[] = ['status', 'jsonPath', 'header', 'bodyContains', 'responseTimeMs'];
const OPERATORS: ApiAssertionOperator[] = ['equals', 'notEquals', 'contains', 'lessThan', 'greaterThan', 'exists'];

/**
 * Sensible success codes per verb. Create endpoints commonly return 201;
 * deletes often return 204. Listing several codes means any one of them passes.
 */
function defaultExpectedStatusForMethod(method: HttpMethod): number[] {
  switch (method) {
    case 'POST':
      return [200, 201];
    case 'PUT':
    case 'PATCH':
      return [200, 201, 204];
    case 'DELETE':
      return [200, 204];
    default:
      return [200];
  }
}

function formatExpectedStatus(statuses: number[]): string {
  return statuses.join(', ');
}

function recordToRows(record?: Record<string, string>): KeyValueRow[] {
  return Object.entries(record ?? {}).map(([key, value]) => ({ key, value }));
}

function rowsToRecord(rows: KeyValueRow[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const row of rows) {
    if (row.key.trim()) {
      record[row.key.trim()] = row.value;
    }
  }
  return record;
}

const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';

const KeyValueEditor: React.FC<{
  title: string;
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}> = ({ title, rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="block text-sm font-medium text-gray-700">{title}</label>
      <button
        type="button"
        onClick={() => onChange([...rows, { key: '', value: '' }])}
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
      >
        <Plus size={12} /> Add
      </button>
    </div>
    {rows.length === 0 ? (
      <p className="text-xs text-gray-400">None configured.</p>
    ) : (
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                variant="compact"
                placeholder={keyPlaceholder}
                value={row.key}
                onChange={(value) =>
                  onChange(rows.map((r, i) => (i === index ? { ...r, key: String(value) } : r)))
                }
              />
            </div>
            <div className="flex-1">
              <Input
                variant="compact"
                placeholder={valuePlaceholder}
                value={row.value}
                onChange={(value) =>
                  onChange(rows.map((r, i) => (i === index ? { ...r, value: String(value) } : r)))
                }
              />
            </div>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="text-gray-400 hover:text-red-500 shrink-0"
              aria-label="Remove row"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const AssertionEditor: React.FC<{
  assertions: ApiAssertion[];
  onChange: (assertions: ApiAssertion[]) => void;
}> = ({ assertions, onChange }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="block text-sm font-medium text-gray-700">Assertions</label>
      <button
        type="button"
        onClick={() =>
          onChange([...assertions, { type: 'jsonPath', path: '', operator: 'equals', value: '' }])
        }
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
      >
        <Plus size={12} /> Add assertion
      </button>
    </div>
    {assertions.length === 0 ? (
      <p className="text-xs text-gray-400">
        Only the expected status codes above will be checked. Add assertions for deeper checks.
      </p>
    ) : (
      <div className="space-y-2">
        {assertions.map((assertion, index) => {
          const update = (patch: Partial<ApiAssertion>) =>
            onChange(assertions.map((a, i) => (i === index ? { ...a, ...patch } : a)));
          const needsPath = assertion.type === 'jsonPath' || assertion.type === 'header';
          const needsValue = assertion.operator !== 'exists';

          return (
            <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  className={`${selectClass} flex-1`}
                  value={assertion.type}
                  onChange={(e) => update({ type: e.target.value as ApiAssertionType })}
                >
                  {ASSERTION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  className={`${selectClass} flex-1`}
                  value={assertion.operator}
                  onChange={(e) => update({ operator: e.target.value as ApiAssertionOperator })}
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onChange(assertions.filter((_, i) => i !== index))}
                  className="text-gray-400 hover:text-red-500 shrink-0"
                  aria-label="Remove assertion"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {needsPath && (
                  <Input
                    variant="compact"
                    placeholder={assertion.type === 'header' ? 'Header name' : 'jsonPath e.g. data.items[0].id'}
                    value={assertion.path ?? ''}
                    onChange={(value) => update({ path: String(value) })}
                  />
                )}
                {needsValue && (
                  <Input
                    variant="compact"
                    placeholder="Expected value"
                    value={typeof assertion.value === 'string' || typeof assertion.value === 'number' ? assertion.value : ''}
                    onChange={(value) => update({ value })}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const TryResultPanel: React.FC<{ result: ApiTestCaseResult }> = ({ result }) => (
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
          {result.ok ? 'All assertions passed' : 'Assertions failed'}
        </span>
      </div>
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Clock size={12} /> {result.durationMs}ms · HTTP {result.status || 'N/A'}
      </span>
    </div>
    {result.error && (
      <p className="text-xs text-rose-700 bg-white rounded px-2 py-1 font-mono">{result.error}</p>
    )}
    <ul className="space-y-1">
      {result.assertionResults.map((assertionResult, index) => (
        <li key={index} className="flex items-start gap-2 text-xs">
          {assertionResult.passed ? (
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle size={12} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className={assertionResult.passed ? 'text-emerald-800' : 'text-rose-800'}>
            {assertionResult.message}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const ApiTestCaseForm: React.FC<ApiTestCaseFormProps> = ({
  moduleOptions,
  initialCase = null,
  onSaved,
  onCancel,
}) => {
  const toast = useToast();
  const createMutation = useCreateApiTestCase();
  const updateMutation = useUpdateApiTestCase();
  const tryMutation = useTryApiTestCase();

  const [name, setName] = useState(initialCase?.name ?? '');
  const [method, setMethod] = useState<HttpMethod>(initialCase?.method ?? 'GET');
  const [url, setUrl] = useState(initialCase?.url ?? '');
  const [moduleId, setModuleId] = useState(initialCase?.moduleId ?? '');
  const [headerRows, setHeaderRows] = useState<KeyValueRow[]>(recordToRows(initialCase?.headers));
  const [queryRows, setQueryRows] = useState<KeyValueRow[]>(recordToRows(initialCase?.queryParams));
  const [bodyText, setBodyText] = useState(
    initialCase?.body !== undefined ? JSON.stringify(initialCase.body, null, 2) : '',
  );
  const initialMethod = initialCase?.method ?? 'GET';
  const [expectedStatus, setExpectedStatus] = useState(
    formatExpectedStatus(
      initialCase?.expectedStatus ?? defaultExpectedStatusForMethod(initialMethod),
    ),
  );
  // When the user hasn't customized expected statuses, keep them in sync with the HTTP method
  // (e.g. switching GET→POST upgrades "200" to "200, 201").
  const [expectedStatusTouched, setExpectedStatusTouched] = useState(
    Boolean(initialCase?.expectedStatus),
  );
  const [assertions, setAssertions] = useState<ApiAssertion[]>(initialCase?.assertions ?? []);
  const [timeoutMs, setTimeoutMs] = useState(initialCase?.timeoutMs ?? 15000);
  const [active, setActive] = useState(initialCase?.active ?? true);
  const [tryResult, setTryResult] = useState<ApiTestCaseResult | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setTryResult(null);
  }, [name, method, url, moduleId, headerRows, queryRows, bodyText, expectedStatus, assertions]);

  const buildPayload = (): ApiTestCasePayload | null => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) {
      setFormError('Name and URL are required.');
      return null;
    }

    const statuses = expectedStatus
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value));

    let body: unknown;
    if (bodyText.trim()) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        setFormError('Body must be valid JSON (or leave blank).');
        return null;
      }
    }

    setFormError('');
    return {
      moduleId: moduleId || null,
      name: trimmedName,
      method,
      url: trimmedUrl,
      headers: rowsToRecord(headerRows),
      queryParams: rowsToRecord(queryRows),
      body,
      expectedStatus: statuses.length > 0 ? statuses : defaultExpectedStatusForMethod(method),
      assertions,
      timeoutMs,
      active,
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
      toast.error('Try failed', err instanceof Error ? err.message : 'Could not execute the request.');
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
          <Globe size={18} className="text-gray-500" />
          Request
        </h2>

        <Input label="Name" value={name} onChange={(v) => setName(String(v))} placeholder="Get campaigns returns 200" />

        {/*
          Method uses a static label above a <select>; Input's `label` prop is a
          *floating* label rendered inside the box instead, which gives the two
          controls different vertical offsets in the same row. Using a matching
          static label + plain (label-less) Input here keeps both boxes aligned
          on the same baseline regardless of grid column width.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 sm:items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
            <select
              className={selectClass}
              value={method}
              onChange={(e) => {
                const nextMethod = e.target.value as HttpMethod;
                setMethod(nextMethod);
                if (!expectedStatusTouched) {
                  setExpectedStatus(formatExpectedStatus(defaultExpectedStatusForMethod(nextMethod)));
                }
              }}
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
            <Input
              value={url}
              onChange={(v) => setUrl(String(v))}
              placeholder="https://api.example.com/campaigns"
            />
          </div>
        </div>

        <AttachModuleField
          label="Attach to module (optional — enables the module's baseUrl for the SSRF allow-list)"
          placeholderOptionLabel="— Standalone / reusable —"
          moduleId={moduleId}
          moduleOptions={moduleOptions}
          onChange={setModuleId}
        />

        <KeyValueEditor title="Headers" rows={headerRows} onChange={setHeaderRows} keyPlaceholder="Authorization" valuePlaceholder="Bearer ..." />
        <KeyValueEditor title="Query parameters" rows={queryRows} onChange={setQueryRows} keyPlaceholder="page" valuePlaceholder="1" />

        <Textarea
          label="Body (JSON, optional)"
          value={bodyText}
          onChange={setBodyText}
          rows={4}
          placeholder={'{\n  "name": "value"\n}'}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Expected status codes (comma-separated)"
              value={expectedStatus}
              onChange={(v) => {
                setExpectedStatusTouched(true);
                setExpectedStatus(String(v));
              }}
              placeholder="200, 201"
            />
            <p className="mt-1 text-xs text-gray-500">
              Any listed code passes. POST creates often return 201 — include both
              {' '}<code className="font-mono">200, 201</code> when either is valid.
            </p>
          </div>
          <Input
            label="Timeout (ms)"
            type="number"
            value={timeoutMs}
            onChange={(v) => setTimeoutMs(Number(v) || 15000)}
          />
        </div>

        <div
          className="inline-flex items-start gap-2 cursor-pointer"
          onClick={() => setActive(!active)}
        >
          <Checkbox id="api-case-active" checked={active} onChange={() => setActive(!active)} />
          <div>
            <span className="text-sm font-medium text-gray-800">Active</span>
            <p className="text-xs text-gray-500">Inactive cases are hidden from the dynamic API runner.</p>
          </div>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">Assertions</h2>
        <p className="text-sm text-gray-500">
          The expected status codes above are always checked first. Add more assertions for response
          body, header, or latency checks.
        </p>
        <AssertionEditor assertions={assertions} onChange={setAssertions} />
      </div>

      {formError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <AlertTriangle size={14} />
          {formError}
        </div>
      )}

      {tryResult && <TryResultPanel result={tryResult} />}

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleTry}
          disabled={tryMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-indigo-200 rounded-md text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
        >
          {tryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Try now
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

export default ApiTestCaseForm;
