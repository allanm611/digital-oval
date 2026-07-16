import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Sparkles, AlertTriangle, Lightbulb,
  Code2, ChevronDown, ChevronUp, ArrowRight,
  Wand2, RefreshCw, BarChart3, TrendingUp,
  ShieldAlert, Target, FileCode2, Clock,
} from 'lucide-react';
import { useAIAnalysis } from '../hooks/useHealthStatus';
import { useGeneratedDrafts } from '../hooks/useTestGenerationDrafts';
import { tw } from '../../../shared/utils/utils';
import { healthCheckPath } from '../constants/routes';
import type { ModuleStatus, AIAnalysis } from '../types/health';

interface AIInsightsContentProps {
  modules: ModuleStatus[];
  runId?: string | null;
  initialTab?: Tab;
}

type Tab = 'overview' | 'analysis' | 'generate';

const ConfidenceBadge: React.FC<{ confidence: AIAnalysis['confidence'] }> = ({ confidence }) => {
  const cfg = {
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-rose-50 text-rose-700 border-rose-200',
  }[confidence];

  const label = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
  }[confidence];

  return (
    <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg}`}>
      {label}
    </span>
  );
};

const HealthOverview: React.FC<{ modules: ModuleStatus[] }> = ({ modules }) => {
  const failing = modules.filter((m) => m.status === 'fail');
  const passing = modules.filter((m) => m.status === 'pass');
  const avgRate = modules.length
    ? Math.round(modules.reduce((sum, m) => sum + m.successRate, 0) / modules.length)
    : 0;

  const topFailing = [...failing]
    .sort((a, b) => b.consecutiveFailures - a.consecutiveFailures)
    .slice(0, 3);

  const stats = [
    { label: 'Avg success rate', value: `${avgRate}%`, color: avgRate >= 80 ? 'text-emerald-600' : avgRate >= 50 ? 'text-amber-600' : 'text-rose-600', icon: TrendingUp },
    { label: 'Passing', value: passing.length, color: 'text-emerald-600', icon: Target },
    { label: 'Failing', value: failing.length, color: 'text-rose-600', icon: ShieldAlert },
    { label: 'Total', value: modules.length, color: 'text-gray-600', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <Icon size={16} className={stat.color} />
              <div className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {topFailing.length > 0 ? (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
            Top failing modules
          </h3>
          <div className="space-y-2">
            {topFailing.map((module) => (
              <div
                key={module.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">{module.name}</div>
                  <div className="text-xs text-gray-500">
                    {module.consecutiveFailures} consecutive failures · {module.successRate}% rate
                  </div>
                </div>
                <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${module.successRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="text-sm font-semibold text-emerald-800">All systems healthy</div>
            <div className="text-xs text-emerald-700">No failing modules detected</div>
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisResult: React.FC<{ analysis: AIAnalysis }> = ({ analysis }) => {
  const [showSelectors, setShowSelectors] = useState(false);

  return (
    <div className="space-y-4">
      <ConfidenceBadge confidence={analysis.confidence} />

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
          <BarChart3 size={13} className="text-blue-600" />
          Summary
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
          <AlertTriangle size={13} className="text-amber-500" />
          Root cause
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.rootCause}</p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">
          <Lightbulb size={13} />
          Suggested fix
        </div>
        <p className="text-sm text-emerald-900 leading-relaxed">{analysis.suggestedFix}</p>
      </div>

      {(analysis.affectedSelectors?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-500"
            onClick={() => setShowSelectors(!showSelectors)}
          >
            <span className="inline-flex items-center gap-2">
              <Code2 size={13} className="text-violet-600" />
              Affected selectors ({analysis.affectedSelectors!.length})
            </span>
            {showSelectors ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showSelectors && (
            <div className="mt-3 space-y-1">
              {analysis.affectedSelectors!.map((selector) => (
                <code
                  key={selector}
                  className="block text-xs font-mono text-violet-800 bg-gray-50 rounded px-2 py-1"
                >
                  {selector}
                </code>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AIInsightsContent: React.FC<AIInsightsContentProps> = ({
  modules,
  runId = null,
  initialTab = 'overview',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [selectedModuleId, setSelectedModuleId] = useState('');

  const {
    data: analysis,
    isLoading: analysisLoading,
    refetch: refetchAnalysis,
  } = useAIAnalysis(activeTab === 'analysis' ? runId : null);

  const { data: recentDrafts = [] } = useGeneratedDrafts();

  const openGenerationStudio = () => {
    const query = selectedModuleId ? `?moduleId=${encodeURIComponent(selectedModuleId)}` : '';
    navigate(`${healthCheckPath('generate')}${query}`);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
    { key: 'analysis', label: 'Failure AI', icon: <Brain size={14} /> },
    { key: 'generate', label: 'Generate', icon: <Wand2 size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <HealthOverview modules={modules} />}

      {activeTab === 'analysis' && (
        <div>
          {!runId ? (
            <div className="text-center py-16 px-6 rounded-xl border border-dashed border-gray-300 bg-gray-50">
              <Brain size={36} className="mx-auto text-gray-300 mb-4" />
              <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                Open a module&apos;s logs on the dashboard, select a failed run, then open AI
                Insights again — or append <code className="text-xs bg-white px-1 rounded">?runId=...</code> to the URL.
              </p>
            </div>
          ) : analysisLoading ? (
            <div className="text-center py-16">
              <Sparkles size={24} className="mx-auto text-indigo-500 animate-pulse mb-3" />
              <p className="text-sm text-gray-600">Claude is analysing the failure…</p>
            </div>
          ) : analysis ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Analysis for run <span className="font-mono text-gray-800">#{runId}</span>
                </p>
                <button
                  type="button"
                  onClick={() => refetchAnalysis()}
                  className="inline-flex items-center gap-1 text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                AI analysis is derived from backend recommendations and may be approximate.
              </p>
              <AnalysisResult analysis={analysis} />
            </>
          ) : (
            <div className="text-center py-16">
              <AlertTriangle size={28} className="mx-auto text-amber-500 mb-3" />
              <p className="text-sm text-gray-600">No analysis available for this run.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <Wand2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-900 leading-relaxed">
              Pick a module, then open the Test Generation Studio — Claude drafts a Playwright
              spec, and nothing is written to disk until you review and approve it there.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module to generate tests for
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              value={selectedModuleId}
              onChange={(event) => setSelectedModuleId(event.target.value)}
            >
              <option value="">— Standalone —</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>{module.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={openGenerationStudio}
            className={`${tw.button} inline-flex items-center gap-2 px-5 py-2.5 text-sm`}
          >
            <Sparkles size={14} />
            Open Test Generation Studio
            <ArrowRight size={14} />
          </button>

          {recentDrafts.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Recent drafts
              </h3>
              {recentDrafts.slice(0, 5).map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => navigate(healthCheckPath('generate'))}
                  className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">{draft.featureName}</span>
                    <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${
                      draft.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : draft.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {draft.status}
                    </span>
                  </div>
                  {draft.createdAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock size={11} />
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsightsContent;
