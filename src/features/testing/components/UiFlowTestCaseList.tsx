import React from 'react';
import { Loader2, Pencil, Trash2, MousePointerClick, PlayCircle } from 'lucide-react';
import { tw } from '../../../shared/utils/utils';
import type { UiFlowTestCase } from '../types/health';

interface UiFlowTestCaseListProps {
  cases: UiFlowTestCase[];
  isLoading?: boolean;
  moduleNameById: Record<string, string>;
  onEdit: (testCase: UiFlowTestCase) => void;
  onDelete: (testCase: UiFlowTestCase) => void;
  onToggleActive: (testCase: UiFlowTestCase) => void;
  togglingId?: string | null;
}

const UiFlowTestCaseList: React.FC<UiFlowTestCaseListProps> = ({
  cases,
  isLoading = false,
  moduleNameById,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-16 px-6 rounded-xl border border-dashed border-gray-300 bg-gray-50">
        <MousePointerClick size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-600">
          No UI flow test cases yet. Create one to start building data-driven browser checks.
        </p>
      </div>
    );
  }

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white shadow-sm overflow-hidden`}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Start URL</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Module</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Steps</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Active</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {cases.map((testCase) => (
            <tr key={testCase.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{testCase.name}</div>
                {testCase.tags && testCase.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {testCase.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-gray-600 font-mono truncate max-w-xs block" title={testCase.startUrl}>
                  {testCase.startUrl}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {testCase.moduleId ? moduleNameById[testCase.moduleId] ?? testCase.moduleId : (
                  <span className="text-gray-400">Standalone</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {testCase.steps.length} step{testCase.steps.length === 1 ? '' : 's'}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={() => onToggleActive(testCase)}
                  disabled={togglingId === testCase.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-60 ${
                    testCase.active ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                  aria-label={testCase.active ? 'Deactivate' : 'Activate'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      testCase.active ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(testCase)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(testCase)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        <PlayCircle size={12} />
        Active flows run automatically via the dynamic UI runner — attach them to a module&apos;s
        test suites to schedule them.
      </div>
    </div>
  );
};

export default UiFlowTestCaseList;
