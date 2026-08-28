import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ApiKeyValueRow } from '../types/health';

export function emptyRow(): ApiKeyValueRow {
  return { key: '', value: '', description: '', enabled: true };
}

export function ensureTrailingEmptyRow(rows: ApiKeyValueRow[]): ApiKeyValueRow[] {
  if (rows.length === 0) return [emptyRow()];
  const last = rows[rows.length - 1];
  if (last.key.trim() || last.value.trim() || (last.description ?? '').trim()) {
    return [...rows, emptyRow()];
  }
  return rows;
}

export function enabledRowCount(rows: ApiKeyValueRow[]): number {
  return rows.filter((row) => row.enabled !== false && row.key.trim()).length;
}

interface ApiKeyValueTableProps {
  rows: ApiKeyValueRow[];
  onChange: (rows: ApiKeyValueRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  emptyHint?: string;
}

/**
 * Postman-style Params/Headers grid: enabled checkbox, Key, Value, Description.
 * Always keeps a trailing blank row so typing feels like Postman.
 */
const ApiKeyValueTable: React.FC<ApiKeyValueTableProps> = ({
  rows,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  emptyHint,
}) => {
  const displayRows = rows.length === 0 ? [emptyRow()] : rows;

  const update = (index: number, patch: Partial<ApiKeyValueRow>) => {
    const source = rows.length === 0 ? [emptyRow()] : rows;
    const next = source.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(ensureTrailingEmptyRow(next));
  };

  const remove = (index: number) => {
    const source = rows.length === 0 ? [emptyRow()] : rows;
    const next = source.filter((_, i) => i !== index);
    onChange(ensureTrailingEmptyRow(next));
  };

  return (
    <div>
      {emptyHint && enabledRowCount(rows) === 0 && (
        <p className="text-xs text-gray-400 mb-2">{emptyHint}</p>
      )}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px] bg-gray-50 text-[11px] font-medium uppercase tracking-wide text-gray-500 border-b border-gray-200">
          <div />
          <div className="px-2 py-2">Key</div>
          <div className="px-2 py-2">Value</div>
          <div className="px-2 py-2">Description</div>
          <div />
        </div>
        {displayRows.map((row, index) => {
          const isLastEmpty =
            index === displayRows.length - 1 && !row.key && !row.value && !(row.description ?? '');
          return (
            <div
              key={index}
              className={`grid grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px] items-center border-b border-gray-100 last:border-b-0 ${
                row.enabled === false ? 'bg-gray-50/80' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={(e) => update(index, { enabled: e.target.checked })}
                  aria-label={`Enable ${row.key || 'row'}`}
                  className="rounded border-gray-300"
                />
              </div>
              <input
                value={row.key}
                onChange={(e) => update(index, { key: e.target.value })}
                placeholder={keyPlaceholder}
                className="w-full px-2 py-2 text-sm border-0 bg-transparent focus:outline-none focus:ring-0 font-mono"
              />
              <input
                value={row.value}
                onChange={(e) => update(index, { value: e.target.value })}
                placeholder={valuePlaceholder}
                className="w-full px-2 py-2 text-sm border-0 bg-transparent focus:outline-none focus:ring-0 font-mono"
              />
              <input
                value={row.description ?? ''}
                onChange={(e) => update(index, { description: e.target.value })}
                placeholder="Description"
                className="w-full px-2 py-2 text-sm border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-600"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={isLastEmpty && displayRows.length === 1}
                className="text-gray-300 hover:text-red-500 disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center"
                aria-label="Remove row"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange(ensureTrailingEmptyRow([...rows, emptyRow()]))}
        className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
      >
        <Plus size={12} /> Add
      </button>
    </div>
  );
};

export default ApiKeyValueTable;
