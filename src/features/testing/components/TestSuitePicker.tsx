import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { tw } from '../../../shared/utils/utils';
import SelectTestSuiteModal from './SelectTestSuiteModal';
import { formatSuiteLabel } from '../utils/testCatalogUtils';

interface TestSuitePickerProps {
  selected: string[];
  onChange: (values: string[]) => void;
  /** Show the inline "+ Add" control. Defaults to true. */
  showAddButton?: boolean;
}

const TestSuitePicker: React.FC<TestSuitePickerProps> = ({
  selected,
  onChange,
  showAddButton = true,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const removeChip = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selected.length === 0
                ? 'No test suites selected'
                : `${selected.length} test suite${selected.length === 1 ? '' : 's'} selected`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Use Add to browse the full Playwright catalog.
            </p>
          </div>
          {showAddButton && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`${tw.button} inline-flex items-center gap-1.5 px-3 py-2 text-sm shrink-0`}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          )}
      </div>

        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
          {selected.map((value) => (
            <span
              key={value}
                className="inline-flex items-center gap-1.5 max-w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                title={value}
              >
                <span className="truncate">{formatSuiteLabel(value)}</span>
                <button
                  type="button"
                  onClick={() => removeChip(value)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${formatSuiteLabel(value)}`}
                >
                  <X className="w-3 h-3" />
                </button>
            </span>
          ))}
        </div>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full rounded-lg border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            Click Add to select test suites, specs, or individual cases
          </button>
        )}

        {selected.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit selection
            </button>
          </div>
        )}
      </div>

      <SelectTestSuiteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selected={selected}
        onConfirm={onChange}
      />
    </>
  );
};

export default TestSuitePicker;
