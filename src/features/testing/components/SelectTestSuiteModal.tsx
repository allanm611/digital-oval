import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, FileCode2 } from 'lucide-react';
import { color, tw, button, getButtonStyles, zIndex } from '../../../shared/utils/utils';
import SearchInput from '../../../shared/components/ui/SearchInput';
import { useTestCatalog } from '../hooks/useHealthStatus';
import TestSuiteTree from './TestSuiteTree';
import { collectValues, filterTree } from '../utils/testCatalogUtils';
import type { TestCatalogNode } from '../types/health';

interface SelectTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: string[];
  onConfirm: (values: string[]) => void;
}

const SelectTestSuiteModal: React.FC<SelectTestSuiteModalProps> = ({
  isOpen,
  onClose,
  selected,
  onConfirm,
}) => {
  const { data, isLoading, isError } = useTestCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  const [pending, setPending] = useState<string[]>(selected);

  useEffect(() => {
    if (isOpen) {
      setPending(selected);
      setSearchTerm('');
    }
  }, [isOpen, selected]);

  const pendingSet = useMemo(() => new Set(pending), [pending]);
  const filtered = useMemo(
    () => filterTree(data ?? [], searchTerm.trim().toLowerCase()),
    [data, searchTerm],
  );

  const handleToggle = (value: string, checked: boolean) => {
    if (checked) {
      setPending((prev) => [...new Set([...prev, value])]);
      return;
    }
    setPending((prev) => prev.filter((item) => item !== value));
  };

  const handleToggleBranch = (node: TestCatalogNode, checked: boolean) => {
    const values = collectValues(node);
    if (checked) {
      setPending((prev) => [...new Set([...prev, ...values])]);
      return;
    }
    const remove = new Set(values);
    setPending((prev) => prev.filter((item) => !remove.has(item)));
  };

  const handleConfirm = () => {
    onConfirm(pending);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ zIndex: zIndex.modal }}
      onClick={onClose}
    >
      <div
        className={`${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col bg-white`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-6 border-b flex-shrink-0"
          style={{ borderColor: color.border.default }}
        >
          <div>
            <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
              Select Test Suites
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Choose folders, spec files, or individual test cases from the Playwright catalog
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 transition-colors"
            style={{ color: color.text.secondary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <SearchInput
            placeholder="Search suites, specs, or test cases..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2
                className="w-12 h-12 mx-auto mb-4 animate-spin"
                strokeWidth={1.5}
                style={{ color: color.text.primary }}
              />
              <p className={tw.textSecondary}>Loading test catalog…</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <FileCode2 className="w-12 h-12 mx-auto mb-4 text-amber-500" />
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                Catalog unavailable
              </h3>
              <p className={tw.textSecondary}>
                Ensure the Playwright health API is reachable and try again.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileCode2
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: color.text.muted }}
              />
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                No tests found
              </h3>
              <p className={tw.textSecondary}>
                {(data?.length ?? 0) === 0
                  ? 'No test cases are available in the catalog yet.'
                  : 'Try adjusting your search terms.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <TestSuiteTree
                nodes={filtered}
                selected={pendingSet}
                onToggle={handleToggle}
                onToggleBranch={handleToggleBranch}
                defaultOpenDepth={1}
              />
            </div>
          )}
        </div>

        <div
          className="px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: color.border.default }}
        >
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="transition-colors hover:opacity-80"
              style={getButtonStyles(button.bordered)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`${tw.button} px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
            >
              Confirm ({pending.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectTestSuiteModal;
