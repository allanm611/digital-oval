import { Plus, Trash2 } from "lucide-react";
import type { ApiKeyValueRow } from "../../../shared/components/ConnectorConfigs/apiConfigTypes";
import {
  createEmptyRow,
  ensureTrailingEmptyRow,
} from "../../../shared/components/ConnectorConfigs/apiConfigUtils";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { tw } from "../../../shared/utils/utils";

interface KeyValueEditorProps {
  rows: ApiKeyValueRow[];
  onChange: (rows: ApiKeyValueRow[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  addLabel?: string;
}

export default function KeyValueEditor({
  rows,
  onChange,
  keyLabel = "Key",
  valueLabel = "Value",
  addLabel = "Add parameter",
}: KeyValueEditorProps) {
  const displayRows = rows.length > 0 ? rows : [createEmptyRow()];

  const updateRow = (id: string, patch: Partial<ApiKeyValueRow>) => {
    onChange(
      ensureTrailingEmptyRow(
        displayRows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      ),
    );
  };

  const removeRow = (id: string) => {
    onChange(
      ensureTrailingEmptyRow(displayRows.filter((row) => row.id !== id)),
    );
  };

  return (
    <div className="space-y-2">
      <div className={`${tw.rounded} overflow-hidden border border-gray-200`}>
        <div className="hidden grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_40px] bg-gray-50 text-xs font-medium text-gray-500 sm:grid">
          <span />
          <span className="px-3 py-2">{keyLabel}</span>
          <span className="px-3 py-2">{valueLabel}</span>
          <span />
        </div>
        {displayRows.map((row) => {
          const isOnlyEmptyRow =
            displayRows.length === 1 && !row.key.trim() && !row.value.trim();
          return (
            <div
              key={row.id}
              className="grid grid-cols-[32px_minmax(0,1fr)_32px] gap-2 border-t border-gray-100 p-2 first:border-t-0 sm:grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_32px] sm:gap-0 sm:p-0"
            >
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={row.enabled}
                  onChange={(event) =>
                    updateRow(row.id, { enabled: event.target.checked })
                  }
                />
              </div>
              <input
                value={row.key}
                onChange={(event) =>
                  updateRow(row.id, { key: event.target.value })
                }
                placeholder={keyLabel}
                className="min-w-0 border-0 bg-transparent px-2 py-2 text-sm focus:outline-none focus:ring-0"
              />
              <input
                value={row.value}
                onChange={(event) =>
                  updateRow(row.id, { value: event.target.value })
                }
                placeholder={valueLabel}
                className="col-start-2 min-w-0 border-0 bg-transparent px-2 py-2 text-sm focus:outline-none focus:ring-0 sm:col-start-auto"
              />
              <button
                type="button"
                disabled={isOnlyEmptyRow}
                onClick={() => removeRow(row.id)}
                className="row-start-1 flex items-center justify-center text-gray-400 hover:text-red-600 disabled:invisible sm:row-start-auto"
                aria-label={`Remove ${row.key || "parameter"}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange(
            ensureTrailingEmptyRow([...displayRows, createEmptyRow()]),
          )
        }
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}
