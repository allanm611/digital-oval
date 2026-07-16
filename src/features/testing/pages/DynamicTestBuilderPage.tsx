import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wand2, Sparkles, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Copy, CheckCheck, ChevronDown, ChevronUp, FileCode2, Clock,
} from 'lucide-react';
import BackButton from '../../../shared/components/ui/BackButton';
import { useToast } from '../../../contexts/ToastContext';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { tw } from '../../../shared/utils/utils';
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import { useHealthStatus } from '../hooks/useHealthStatus';
import {
  useApproveGeneratedDraft,
  useGeneratedDrafts,
  useRejectGeneratedDraft,
  useRequestTestGeneration,
} from '../hooks/useTestGenerationDrafts';
import { HEALTH_CHECK_BASE } from '../constants/routes';
import type { GeneratedTestDraft, GeneratedTestDraftStatus } from '../types/health';

const STATUS_BADGE: Record<GeneratedTestDraftStatus, string> = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CodePreview: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Collapse code' : 'View generated code'}
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
        >
          {copied ? <><CheckCheck size={12} />Copied</> : <><Copy size={12} />Copy</>}
        </button>
      </div>
      {expanded && (
        <pre className="m-0 p-4 overflow-x-auto text-xs leading-relaxed text-indigo-900 font-mono whitespace-pre max-h-96">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

const DraftCard: React.FC<{
  draft: GeneratedTestDraft;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}> = ({ draft, onApprove, onReject, isApproving, isRejecting }) => {
  const isPending = draft.status === 'draft';

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-4 shadow-sm space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">{draft.featureName}</span>
            <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_BADGE[draft.status]}`}>
              {draft.status}
            </span>
          </div>
          {draft.sourceUrl && (
            <p className="text-xs text-gray-500 mt-1 font-mono truncate max-w-md">{draft.sourceUrl}</p>
          )}
          {draft.specPath && (
            <p className="text-xs text-emerald-700 mt-1 font-mono">{draft.specPath}</p>
          )}
        </div>
        {draft.createdAt && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 shrink-0">
            <Clock size={12} />
            {new Date(draft.createdAt).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {draft.safetyWarnings.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          {draft.safetyWarnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              {warning}
            </div>
          ))}
        </div>
      )}

      <CodePreview code={draft.generatedCode} />

      {isPending && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onApprove(draft.id)}
            disabled={isApproving || isRejecting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isApproving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Approve &amp; write to disk
          </button>
          <button
            type="button"
            onClick={() => onReject(draft.id)}
            disabled={isApproving || isRejecting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-rose-200 rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            {isRejecting ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default function DynamicTestBuilderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const { data: dashboard } = useHealthStatus();
  const moduleOptions = useMemo(
    () => (dashboard?.modules ?? []).map((module) => ({ id: module.id, name: module.name })),
    [dashboard?.modules],
  );

  const [moduleId, setModuleId] = useState(searchParams.get('moduleId') ?? '');
  const [featureName, setFeatureName] = useState('');
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [formError, setFormError] = useState('');

  const { data: drafts = [], isLoading: draftsLoading } = useGeneratedDrafts();
  const requestGeneration = useRequestTestGeneration();
  const approveDraft = useApproveGeneratedDraft();
  const rejectDraft = useRejectGeneratedDraft();

  const handleBack = () => {
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

  const handleGenerate = async () => {
    if (!featureName.trim() || !url.trim()) {
      setFormError('Feature name and target URL are required.');
      return;
    }
    setFormError('');
    try {
      const draft = await requestGeneration.mutateAsync({
        moduleId: moduleId || undefined,
        featureName: featureName.trim(),
        url: url.trim(),
        prompt: prompt.trim() || undefined,
      });
      toast.success(
        'Draft generated',
        draft.safetyWarnings.length > 0
          ? 'Review the safety warnings before approving.'
          : 'Review the generated code, then approve to write it to disk.',
      );
      setFeatureName('');
      setUrl('');
      setPrompt('');
    } catch (err) {
      toast.error('Generation failed', err instanceof Error ? err.message : 'Could not generate a draft.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const draft = await approveDraft.mutateAsync(id);
      toast.success('Draft approved', `Written to ${draft.specPath ?? 'e2e/tests/generated/'}.`);
    } catch (err) {
      toast.error('Approval failed', err instanceof Error ? err.message : 'The draft may contain unsafe code.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectDraft.mutateAsync(id);
      toast.info('Draft rejected', 'It will remain in history but was not written to disk.');
    } catch (err) {
      toast.error('Rejection failed', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb
        parentLabel="Health Check"
        currentLabel="Generate Tests"
        onClick={handleBack}
      />

      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0">
          <Wand2 size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Tests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe a feature and Claude drafts a Playwright E2E spec. Nothing is written to disk
            until you review and approve it.
          </p>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">New generation request</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attach to module (optional)
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            value={moduleId}
            onChange={(event) => setModuleId(event.target.value)}
          >
            <option value="">— Standalone —</option>
            {moduleOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>

        <Input
          label="Feature name"
          value={featureName}
          onChange={(value) => setFeatureName(String(value))}
          placeholder="Campaign creation flow"
        />

        <Input
          label="Target URL"
          value={url}
          onChange={(value) => setUrl(String(value))}
          placeholder="https://app.example.com/campaigns/new"
        />

        <Textarea
          label="Additional instructions (optional)"
          value={prompt}
          onChange={setPrompt}
          rows={3}
          placeholder="Focus on the multi-step wizard and validation errors…"
        />

        {formError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            <AlertTriangle size={14} />
            {formError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={requestGeneration.isPending}
            className={`${tw.button} inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60`}
          >
            {requestGeneration.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating with Claude…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate draft
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Drafts</h2>
        {draftsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-xl border border-dashed border-gray-300 bg-gray-50">
            <Wand2 size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-600">No drafts yet. Generate one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={approveDraft.isPending && approveDraft.variables === draft.id}
                isRejecting={rejectDraft.isPending && rejectDraft.variables === draft.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
