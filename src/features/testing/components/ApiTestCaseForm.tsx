import React, { useEffect, useMemo, useState } from 'react';
import {
  Play, Plus, Trash2, Save, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Clock, Globe, Braces,
} from 'lucide-react';
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import Checkbox from '../../../shared/components/ui/Checkbox';
import MultiSelect from '../../../shared/components/ui/MultiSelect';
import { useToast } from '../../../contexts/ToastContext';
import { tw, button, getButtonStyles } from '../../../shared/utils/utils';
import { useCreateApiTestCase, useTryApiTestCase, useUpdateApiTestCase } from '../hooks/useApiTestCases';
import AttachModuleField from './AttachModuleField';
import ApiKeyValueTable, { emptyRow, enabledRowCount, ensureTrailingEmptyRow } from './ApiKeyValueTable';
import {
  buildStatusSelectOptions,
  canHaveRequestBody,
  defaultExpectedStatusForMethod,
  httpStatusLabel,
  METHOD_TEXT_CLASS,
  statusBadgeClass,
} from '../constants/httpStatusCodes';
import type {
  ApiAssertion,
  ApiAssertionOperator,
  ApiAssertionType,
  ApiAuthConfig,
  ApiBodyConfig,
  ApiBodyMode,
  ApiKeyValueRow,
  ApiRawLanguage,
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

type RequestTab = 'params' | 'auth' | 'headers' | 'body' | 'tests';
type ResponseTab = 'body' | 'headers' | 'results';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
const BODY_MODES: { id: ApiBodyMode; label: string }[] = [
  { id: 'none', label: 'none' },
  { id: 'form-data', label: 'form-data' },
  { id: 'urlencoded', label: 'x-www-form-urlencoded' },
  { id: 'raw', label: 'raw' },
  { id: 'binary', label: 'binary' },
  { id: 'graphql', label: 'GraphQL' },
];
const RAW_LANGUAGES: { id: ApiRawLanguage; label: string }[] = [
  { id: 'json', label: 'JSON' },
  { id: 'text', label: 'Text' },
  { id: 'xml', label: 'XML' },
  { id: 'html', label: 'HTML' },
];
const AUTH_TYPES: { id: ApiAuthConfig['type']; label: string }[] = [
  { id: 'none', label: 'No Auth' },
  { id: 'bearer', label: 'Bearer Token' },
  { id: 'basic', label: 'Basic Auth' },
  { id: 'apikey', label: 'API Key' },
];
const ASSERTION_TYPES: { value: ApiAssertionType; label: string }[] = [
  { value: 'jsonPath', label: 'JSON path' },
  { value: 'header', label: 'Header' },
  { value: 'bodyContains', label: 'Body contains' },
  { value: 'responseTimeMs', label: 'Response time (ms)' },
  { value: 'status', label: 'Status (advanced)' },
];
const OPERATORS: { value: ApiAssertionOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'lessThan', label: 'less than' },
  { value: 'greaterThan', label: 'greater than' },
  { value: 'exists', label: 'exists' },
];

const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';

function recordToRows(record?: Record<string, string>): ApiKeyValueRow[] {
  return Object.entries(record ?? {}).map(([key, value]) => ({
    key,
    value,
    description: '',
    enabled: true,
  }));
}

function inferAuth(headers?: Record<string, string>): ApiAuthConfig {
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === 'authorization');
  if (!entry) return { type: 'none' };
  const value = entry[1];
  const bearer = /^Bearer\s+(.+)$/i.exec(value);
  if (bearer) return { type: 'bearer', bearerToken: bearer[1] };
  return { type: 'none' };
}

function inferBody(initialCase?: ApiTestCase | null): ApiBodyConfig {
  const fromEditor = initialCase?.editor?.body;
  if (fromEditor?.mode) return fromEditor;
  if (initialCase?.body == null) return { mode: 'none' };
  if (typeof initialCase.body === 'string') {
    return { mode: 'raw', rawLanguage: 'text', raw: initialCase.body };
  }
  return { mode: 'raw', rawLanguage: 'json', raw: JSON.stringify(initialCase.body, null, 2) };
}

function editorFromCase(initialCase?: ApiTestCase | null): {
  queryRows: ApiKeyValueRow[];
  headerRows: ApiKeyValueRow[];
  auth: ApiAuthConfig;
  body: ApiBodyConfig;
} {
  const editor = initialCase?.editor;
  const hasEditor = Boolean(
    editor?.queryRows?.length ||
      editor?.headerRows?.length ||
      (editor?.auth && editor.auth.type !== 'none') ||
      (editor?.body && editor.body.mode !== 'none'),
  );
  if (hasEditor && editor) {
    const headers = [...(editor.headerRows ?? [])];
    return {
      queryRows: ensureTrailingEmptyRow(editor.queryRows ?? []),
      headerRows: ensureTrailingEmptyRow(headers),
      auth: editor.auth ?? { type: 'none' },
      body: editor.body ?? { mode: 'none' },
    };
  }

  const inferredAuth = inferAuth(initialCase?.headers);
  const headers = recordToRows(initialCase?.headers).filter((row) => {
    if (inferredAuth.type !== 'none' && row.key.toLowerCase() === 'authorization') return false;
    return true;
  });

  return {
    queryRows: ensureTrailingEmptyRow(recordToRows(initialCase?.queryParams)),
    headerRows: ensureTrailingEmptyRow(headers),
    auth: inferredAuth,
    body: inferBody(initialCase),
  };
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatJsonBody(raw: string): string | null {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return null;
  }
}

function formatResponseBody(preview?: string): string {
  if (!preview) return '(empty body)';
  return formatJsonBody(preview) ?? preview;
}

function formatByteSize(value?: string): string {
  const bytes = value ? new TextEncoder().encode(value).length : 0;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function normalizeStatusCodes(values: (string | number)[]): number[] {
  const unique = new Set<number>();
  for (const value of values) {
    const code = Number(value);
    if (Number.isInteger(code) && code >= 100 && code <= 599) {
      unique.add(code);
    }
  }
  return [...unique].sort((a, b) => a - b);
}

function statusesMatch(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

const AssertionEditor: React.FC<{
  assertions: ApiAssertion[];
  onChange: (assertions: ApiAssertion[]) => void;
}> = ({ assertions, onChange }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="block text-sm font-medium text-gray-700">Response assertions</label>
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
        Status is already checked above. Add assertions for JSON, headers, body text, or latency.
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
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <select
                  className={`${selectClass} flex-1`}
                  value={assertion.operator}
                  onChange={(e) => update({ operator: e.target.value as ApiAssertionOperator })}
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
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

const RequestTabButton: React.FC<{
  id: RequestTab;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}> = ({ id, label, count, active, onClick }) => (
  <button
    type="button"
    id={`request-tab-${id}`}
    onClick={onClick}
    className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
      active
        ? 'border-indigo-600 text-indigo-700 font-medium'
        : 'border-transparent text-gray-500 hover:text-gray-800'
    }`}
  >
    {label}
    {typeof count === 'number' && count > 0 && (
      <span className="ml-1.5 text-[10px] font-semibold text-gray-400">{count}</span>
    )}
  </button>
);

const TryResultPanel: React.FC<{ result: ApiTestCaseResult }> = ({ result }) => {
  const [tab, setTab] = useState<ResponseTab>(result.ok ? 'body' : 'results');
  const headerEntries = Object.entries(result.responseHeaders ?? {});

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white shadow-sm overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
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
        <div className="flex items-center gap-3 text-xs">
          <span
            className={`inline-flex items-center rounded border px-2 py-0.5 font-semibold ${statusBadgeClass(result.status)}`}
          >
            {result.status ? httpStatusLabel(result.status) : 'No response'}
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500">
            <Clock size={12} /> {result.durationMs} ms
          </span>
          <span className="text-gray-500">{formatByteSize(result.responseBodyPreview)}</span>
        </div>
      </div>

      {result.error && (
        <p className="mx-4 mt-3 text-xs text-rose-700 bg-rose-50 rounded px-2 py-1.5 font-mono">{result.error}</p>
      )}

      <div className="flex items-center gap-1 px-4 border-b border-gray-200">
        {([
          ['body', 'Body'],
          ['headers', `Headers${headerEntries.length ? ` (${headerEntries.length})` : ''}`],
          ['results', `Test Results (${result.assertionResults.length})`],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === id
                ? 'border-indigo-600 text-indigo-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'body' && (
          <pre className="text-xs font-mono text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-80 overflow-auto whitespace-pre-wrap break-all">
            {formatResponseBody(result.responseBodyPreview)}
          </pre>
        )}
        {tab === 'headers' && (
          headerEntries.length === 0 ? (
            <p className="text-xs text-gray-400">No response headers returned for this try.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {headerEntries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[minmax(8rem,14rem)_1fr] gap-3 px-3 py-1.5 text-xs">
                  <span className="font-medium text-gray-600 font-mono">{key}</span>
                  <span className="text-gray-800 font-mono break-all">{value}</span>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 'results' && (
          <ul className="space-y-1.5">
            {result.assertionResults.length === 0 && !result.error && (
              <li className="text-xs text-gray-400">No assertion results.</li>
            )}
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
        )}
      </div>
    </div>
  );
};

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

  const seeded = editorFromCase(initialCase);
  const [name, setName] = useState(initialCase?.name ?? '');
  const [method, setMethod] = useState<HttpMethod>(initialCase?.method ?? 'GET');
  const [url, setUrl] = useState(initialCase?.url ?? '');
  const [moduleId, setModuleId] = useState(initialCase?.moduleId ?? '');
  const [queryRows, setQueryRows] = useState<ApiKeyValueRow[]>(seeded.queryRows);
  const [headerRows, setHeaderRows] = useState<ApiKeyValueRow[]>(seeded.headerRows);
  const [auth, setAuth] = useState<ApiAuthConfig>(seeded.auth);
  const [bodyConfig, setBodyConfig] = useState<ApiBodyConfig>(seeded.body);
  const initialMethod = initialCase?.method ?? 'GET';
  const initialStatuses = initialCase?.expectedStatus?.length
    ? normalizeStatusCodes(initialCase.expectedStatus)
    : defaultExpectedStatusForMethod(initialMethod);
  const [expectedStatus, setExpectedStatus] = useState<number[]>(initialStatuses);
  const [expectedStatusTouched, setExpectedStatusTouched] = useState(
    Boolean(initialCase) && !statusesMatch(initialStatuses, defaultExpectedStatusForMethod(initialMethod)),
  );
  const [assertions, setAssertions] = useState<ApiAssertion[]>(initialCase?.assertions ?? []);
  const [timeoutMs, setTimeoutMs] = useState(initialCase?.timeoutMs ?? 15000);
  const [active, setActive] = useState(initialCase?.active ?? true);
  const [tryResult, setTryResult] = useState<ApiTestCaseResult | null>(null);
  const [formError, setFormError] = useState('');
  const [requestTab, setRequestTab] = useState<RequestTab>('params');
  const [jsonError, setJsonError] = useState(false);

  const statusOptions = useMemo(
    () => buildStatusSelectOptions(expectedStatus),
    [expectedStatus],
  );
  const bodyAllowed = canHaveRequestBody(method);
  const filledQueryCount = enabledRowCount(queryRows);
  const filledHeaderCount = enabledRowCount(headerRows);
  const authGeneratesHeader = auth.type === 'bearer' || auth.type === 'basic' || (auth.type === 'apikey' && auth.apiKeyIn !== 'query');
  const headerTabCount = filledHeaderCount + (authGeneratesHeader ? 1 : 0);
  const bodyTabCount =
    bodyAllowed && bodyConfig.mode && bodyConfig.mode !== 'none' && bodyConfig.mode !== 'binary' ? 1 : 0;

  useEffect(() => {
    setTryResult(null);
  }, [name, method, url, moduleId, headerRows, queryRows, auth, bodyConfig, expectedStatus, assertions]);

  const patchBody = (patch: Partial<ApiBodyConfig>) => setBodyConfig((current) => ({ ...current, ...patch }));

  const buildPayload = (): ApiTestCasePayload | null => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) {
      setFormError('Name and URL are required.');
      return null;
    }
    if (!isAbsoluteHttpUrl(trimmedUrl)) {
      setFormError('URL must be an absolute http(s) address, e.g. https://api.example.com/campaigns.');
      return null;
    }
    if (expectedStatus.length === 0) {
      setFormError('Select at least one expected status code.');
      setRequestTab('tests');
      return null;
    }
    if (bodyAllowed && bodyConfig.mode === 'binary') {
      setRequestTab('body');
      setFormError('Binary file bodies cannot be stored for scheduled API tests. Use raw, form-data, or x-www-form-urlencoded.');
      return null;
    }
    if (auth.type === 'bearer' && !(auth.bearerToken ?? '').trim()) {
      setRequestTab('auth');
      setFormError('Bearer token is required, or switch Auth Type to No Auth.');
      return null;
    }
    if (auth.type === 'apikey' && !(auth.apiKey ?? '').trim()) {
      setRequestTab('auth');
      setFormError('API key name is required.');
      return null;
    }

    const clampedTimeout = Math.min(120000, Math.max(1000, Number(timeoutMs) || 15000));
    const nextBody: ApiBodyConfig = { ...bodyConfig, mode: bodyAllowed ? bodyConfig.mode : 'none' };

    if (bodyAllowed && nextBody.mode === 'raw' && (nextBody.rawLanguage ?? 'json') === 'json' && (nextBody.raw ?? '').trim()) {
      if (!formatJsonBody(nextBody.raw ?? '')) {
        setJsonError(true);
        setRequestTab('body');
        setFormError('Raw JSON body is invalid. Beautify/fix it, or switch language to Text.');
        return null;
      }
    }
    if (bodyAllowed && nextBody.mode === 'graphql' && (nextBody.graphqlVariables ?? '').trim()) {
      try {
        const parsed = JSON.parse(nextBody.graphqlVariables ?? '');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('variables must be an object');
        }
      } catch {
        setRequestTab('body');
        setFormError('GraphQL variables must be a JSON object, e.g. { "id": 1 }.');
        return null;
      }
    }

    setJsonError(false);
    setFormError('');
    return {
      moduleId: moduleId || null,
      name: trimmedName,
      method,
      url: trimmedUrl,
      editor: {
        queryRows,
        headerRows,
        auth,
        body: nextBody,
      },
      expectedStatus,
      assertions,
      timeoutMs: clampedTimeout,
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

  const handleFormatBody = () => {
    const raw = bodyConfig.raw ?? '';
    if (!raw.trim()) return;
    const formatted = formatJsonBody(raw);
    if (!formatted) {
      setJsonError(true);
      setFormError('Body must be valid JSON before it can be formatted.');
      return;
    }
    setJsonError(false);
    setFormError('');
    patchBody({ raw: formatted });
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

        <AttachModuleField
          label="Attach to module (optional — enables the module's baseUrl for the SSRF allow-list)"
          placeholderOptionLabel="— Standalone / reusable —"
          moduleId={moduleId}
          moduleOptions={moduleOptions}
          onChange={setModuleId}
        />

        <div className="flex items-stretch rounded-lg border border-gray-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <label className="sr-only" htmlFor="api-test-method">Method</label>
          <select
            id="api-test-method"
            className={`w-[118px] shrink-0 border-0 bg-gray-50 px-3 py-2.5 text-sm font-bold uppercase tracking-wide focus:outline-none focus:ring-0 ${METHOD_TEXT_CLASS[method]}`}
            value={method}
            onChange={(e) => {
              const nextMethod = e.target.value as HttpMethod;
              setMethod(nextMethod);
              if (!canHaveRequestBody(nextMethod)) {
                patchBody({ mode: 'none' });
              }
              if (!expectedStatusTouched) {
                setExpectedStatus(defaultExpectedStatusForMethod(nextMethod));
              }
            }}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="w-px bg-gray-200 shrink-0" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/campaigns"
            className="flex-1 min-w-0 px-3 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0"
            aria-label="Request URL"
          />
          <button
            type="button"
            onClick={handleTry}
            disabled={tryMutation.isPending}
            className="inline-flex items-center gap-2 px-4 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shrink-0"
          >
            {tryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Send
          </button>
        </div>
        

        <div className="border-b border-gray-200 flex items-center gap-1 overflow-x-auto">
          <RequestTabButton
            id="params"
            label="Params"
            count={filledQueryCount}
            active={requestTab === 'params'}
            onClick={() => setRequestTab('params')}
          />
          <RequestTabButton
            id="auth"
            label="Authorization"
            count={auth.type !== 'none' ? 1 : 0}
            active={requestTab === 'auth'}
            onClick={() => setRequestTab('auth')}
          />
          <RequestTabButton
            id="headers"
            label="Headers"
            count={headerTabCount}
            active={requestTab === 'headers'}
            onClick={() => setRequestTab('headers')}
          />
          <RequestTabButton
            id="body"
            label="Body"
            count={bodyTabCount}
            active={requestTab === 'body'}
            onClick={() => setRequestTab('body')}
          />
          <RequestTabButton
            id="tests"
            label="Tests"
            count={expectedStatus.length + assertions.length}
            active={requestTab === 'tests'}
            onClick={() => setRequestTab('tests')}
          />
        </div>

        {requestTab === 'params' && (
          <div>
            <p className="text-sm font-medium text-gray-800 mb-2">Query Params</p>
            <ApiKeyValueTable
              rows={queryRows}
              onChange={setQueryRows}
              keyPlaceholder="page"
              valuePlaceholder="1"
              emptyHint="Query params are appended to the URL. Uncheck a row to skip it without deleting."
            />
          </div>
        )}

        {requestTab === 'auth' && (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auth Type</label>
              <select
                className={selectClass}
                value={auth.type}
                onChange={(e) => setAuth({ ...auth, type: e.target.value as ApiAuthConfig['type'] })}
              >
                {AUTH_TYPES.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                The authorization header is generated when you Send. Do not also set Authorization under Headers.
              </p>
            </div>
            <div className="min-h-[140px] flex flex-col justify-center">
              {auth.type === 'none' && (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm font-medium text-gray-700">No Auth</p>
                  <p className="text-xs mt-1">This request does not use any authorization.</p>
                </div>
              )}
              {auth.type === 'bearer' && (
                <Input
                  label="Token"
                  type="password"
                  value={auth.bearerToken ?? ''}
                  onChange={(v) => setAuth({ ...auth, bearerToken: String(v) })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                />
              )}
              {auth.type === 'basic' && (
                <div className="space-y-3">
                  <Input
                    label="Username"
                    value={auth.username ?? ''}
                    onChange={(v) => setAuth({ ...auth, username: String(v) })}
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={auth.password ?? ''}
                    onChange={(v) => setAuth({ ...auth, password: String(v) })}
                  />
                </div>
              )}
              {auth.type === 'apikey' && (
                <div className="space-y-3">
                  <Input
                    label="Key"
                    value={auth.apiKey ?? ''}
                    onChange={(v) => setAuth({ ...auth, apiKey: String(v) })}
                    placeholder="X-API-Key"
                  />
                  <Input
                    label="Value"
                    type="password"
                    value={auth.apiValue ?? ''}
                    onChange={(v) => setAuth({ ...auth, apiValue: String(v) })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add to</label>
                    <select
                      className={selectClass}
                      value={auth.apiKeyIn ?? 'header'}
                      onChange={(e) => setAuth({ ...auth, apiKeyIn: e.target.value as 'header' | 'query' })}
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Params</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {requestTab === 'headers' && (
          <div>
            {auth.type !== 'none' && (
              <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-3 py-2 mb-3">
                {auth.type === 'apikey' && auth.apiKeyIn === 'query'
                  ? `API key “${auth.apiKey || '…'}” is added as a query param from the Authorization tab.`
                  : 'Authorization is generated from the Authorization tab and will overwrite a manual Authorization header.'}
              </p>
            )}
            <ApiKeyValueTable
              rows={headerRows}
              onChange={setHeaderRows}
              keyPlaceholder="Content-Type"
              valuePlaceholder="application/json"
              emptyHint="Hidden/auto headers from Authorization are not listed here."
            />
          </div>
        )}

        {requestTab === 'body' && (
          <div className="space-y-3">
            {!bodyAllowed ? (
              <p className="text-xs text-gray-500">
                {method} requests do not send a body. Switch the method to POST, PUT, PATCH, or DELETE to attach one.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {BODY_MODES.map((option) => (
                      <label key={option.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="api-body-mode"
                          checked={bodyConfig.mode === option.id}
                          onChange={() => patchBody({ mode: option.id })}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  {bodyConfig.mode === 'raw' && (
                    <div className="flex items-center gap-3">
                      <select
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                        value={bodyConfig.rawLanguage ?? 'json'}
                        onChange={(e) => patchBody({ rawLanguage: e.target.value as ApiRawLanguage })}
                      >
                        {RAW_LANGUAGES.map((language) => (
                          <option key={language.id} value={language.id}>{language.label}</option>
                        ))}
                      </select>
                      {(bodyConfig.rawLanguage ?? 'json') === 'json' && (
                        <button
                          type="button"
                          onClick={handleFormatBody}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          <Braces size={12} /> Beautify
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {bodyConfig.mode === 'none' && (
                  <p className="text-xs text-gray-400">This request will be sent without a body.</p>
                )}
                {(bodyConfig.mode === 'form-data' || bodyConfig.mode === 'urlencoded') && (
                  <ApiKeyValueTable
                    rows={bodyConfig.formRows ?? [emptyRow()]}
                    onChange={(rows) => patchBody({ formRows: rows })}
                    keyPlaceholder="field"
                    valuePlaceholder="value"
                    emptyHint={
                      bodyConfig.mode === 'form-data'
                        ? 'Text fields only — file parts are not stored for scheduled API tests.'
                        : 'Sent as application/x-www-form-urlencoded.'
                    }
                  />
                )}
                {bodyConfig.mode === 'raw' && (
                  <Textarea
                    value={bodyConfig.raw ?? ''}
                    onChange={(value) => {
                      patchBody({ raw: value });
                      setJsonError(false);
                    }}
                    rows={10}
                    hasError={jsonError}
                    placeholder={(bodyConfig.rawLanguage ?? 'json') === 'json' ? '{\n  "name": "value"\n}' : ''}
                    className="font-mono"
                  />
                )}
                {bodyConfig.mode === 'binary' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
                    Binary uploads cannot be saved into a scheduled health-check case (there is no durable file store per test).
                    Use <span className="font-medium">form-data</span> text fields or <span className="font-medium">raw</span> instead.
                  </div>
                )}
                {bodyConfig.mode === 'graphql' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Query</label>
                      <Textarea
                        value={bodyConfig.graphqlQuery ?? ''}
                        onChange={(value) => patchBody({ graphqlQuery: value })}
                        rows={10}
                        placeholder={'query {\n  campaigns {\n    id\n  }\n}'}
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Variables (JSON)</label>
                      <Textarea
                        value={bodyConfig.graphqlVariables ?? ''}
                        onChange={(value) => patchBody({ graphqlVariables: value })}
                        rows={10}
                        placeholder={'{\n  "id": "1"\n}'}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {requestTab === 'tests' && (
          <div className="space-y-4">
            <div>
              <MultiSelect
                label="Expected status codes"
                placeholder="Select one or more status codes"
                options={statusOptions}
                value={expectedStatus}
                onChange={(values) => {
                  setExpectedStatusTouched(true);
                  setExpectedStatus(normalizeStatusCodes(values));
                }}
                error={expectedStatus.length === 0 ? 'Select at least one status code' : undefined}
              />
              <p className="mt-1 text-xs text-gray-500">
                Any selected code passes. POST creates often return 201 — keep both 200 and 201 when either is valid.
              </p>
            </div>
            <AssertionEditor assertions={assertions} onChange={setAssertions} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <Input
            label="Timeout (ms)"
            type="number"
            min={1000}
            max={120000}
            value={timeoutMs}
            onChange={(v) => setTimeoutMs(Number(v) || 15000)}
          />
          <div
            className="inline-flex items-start gap-2 cursor-pointer sm:pt-6"
            onClick={() => setActive(!active)}
          >
            <Checkbox id="api-case-active" checked={active} onChange={() => setActive(!active)} />
            <div>
              <span className="text-sm font-medium text-gray-800">Active</span>
              <p className="text-xs text-gray-500">Inactive cases are hidden from the dynamic API runner.</p>
            </div>
          </div>
        </div>
      </div>

      {formError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <AlertTriangle size={14} />
          {formError}
        </div>
      )}

      {tryResult && (
        <TryResultPanel
          key={`${tryResult.status}-${tryResult.durationMs}-${tryResult.ok}-${tryResult.requestUrl}`}
          result={tryResult}
        />
      )}

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
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
  );
};

export default ApiTestCaseForm;
