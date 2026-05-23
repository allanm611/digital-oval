import { useState } from "react";
import { Copy, ChevronDown, ChevronRight } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLanguage } from "@codemirror/lang-sql";
import { color, tw } from "../../../shared/utils/utils";

interface QueryEditorTabProps {
  sql: string;
  onSqlChange: (sql: string) => void;
  onPreviewResult: (result: { count: number; executionTime: number } | null) => void;
  isPreviewLoading: boolean;
  previewResult?: { count: number; executionTime: number } | null;
  previewError?: string | null;
  onPreview: () => void;
}

const SEGMENT_TABLES = [
  {
    name: "subscribers",
    columns: [
      "id",
      "name",
      "email",
      "phone_number",
      "customer_number",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "subscriber_daily_portfolio",
    columns: [
      "subscriber_id",
      "portfolio_date",
      "revenue",
      "purchases",
      "order_count",
    ],
  },
  {
    name: "subscriber_monthly_portfolio",
    columns: [
      "subscriber_id",
      "portfolio_month",
      "total_revenue",
      "total_purchases",
      "order_count",
    ],
  },
];

interface ColumnButtonProps {
  column: string;
  onCopy: (column: string) => void;
}

function ColumnButton({ column, onCopy }: ColumnButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onCopy(column)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full flex items-center justify-between gap-2 px-4 py-1.5 text-sm transition-colors`}
      title={`Click to copy: ${column}`}
    >
      <span
        className="truncate"
        style={{ color: tw.textSecondary }}
      >
        {column}
      </span>
      <Copy
        className="w-3 h-3 flex-shrink-0 transition-opacity"
        style={{ color: color.primary.accent, opacity: isHovered ? 1 : 0.3 }}
      />
    </button>
  );
}

export default function QueryEditorTab({
  sql,
  onSqlChange,
  onPreviewResult,
  isPreviewLoading,
  previewResult,
  previewError,
  onPreview,
}: QueryEditorTabProps) {
  const [expandedTables, setExpandedTables] = useState<string[]>([
    "subscribers",
  ]);

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) =>
      prev.includes(tableName)
        ? prev.filter((t) => t !== tableName)
        : [...prev, tableName]
    );
  };

  const copyColumn = (columnName: string) => {
    navigator.clipboard.writeText(columnName);
  };

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Left Panel - Schema Browser (DBeaver style) */}
      <div
        className={`w-72 flex-shrink-0 overflow-y-auto`}
        style={{
          backgroundColor: "#ffffff",
          borderRight: `1px solid ${tw.borderDefault}`,
        }}
      >
        <div className="p-3">
          <h3 className={`text-xs font-medium uppercase tracking-wide ${tw.textSecondary} mb-2`}>
            Tables
          </h3>
          <div className="space-y-0">
            {SEGMENT_TABLES.map((table) => (
              <div key={table.name}>
                <button
                  type="button"
                  onClick={() => toggleTable(table.name)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm transition-colors hover:bg-gray-200`}
                  style={{
                    backgroundColor: "transparent",
                    color: tw.textPrimary,
                  }}
                >
                  <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {expandedTables.includes(table.name) ? (
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: color.primary.accent }} />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: color.primary.accent }} />
                    )}
                  </span>
                  <span className="truncate text-sm font-mono">{table.name}</span>
                </button>

                {/* Columns */}
                {expandedTables.includes(table.name) && (
                  <div className="ml-0" style={{ backgroundColor: "#ffffff" }}>
                    {table.columns.map((column) => (
                      <ColumnButton
                        key={column}
                        column={column}
                        onCopy={copyColumn}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - SQL Editor */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* SQL Editor with CodeMirror */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <label className={`block text-sm font-medium ${tw.textPrimary}`}>
            SQL Query
          </label>
          <div
            className={`flex-1 border overflow-hidden`}
            style={{
              backgroundColor: "#ffffff",
              borderColor: previewError ? "#ef4444" : tw.borderDefault,
              minHeight: "320px",
            }}
          >
            <CodeMirror
              value={sql}
              height="100%"
              extensions={[sqlLanguage()]}
              onChange={(value) => onSqlChange(value)}
              theme="light"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                highlightSelectionMatches: true,
                searchKeymap: true,
              }}
              className="codemirror-editor"
              placeholder="SELECT COUNT(*) FROM subscribers WHERE name LIKE 'allan%'"
            />
          </div>
        </div>

        {/* Preview Result or Error */}
        {previewResult && (
          <div
            className={`p-3`}
            style={{
              backgroundColor: `${color.primary.accent}10`,
              borderLeft: `3px solid ${color.primary.accent}`,
            }}
          >
            <p className={`text-sm font-semibold ${tw.textPrimary}`}>
              ✓ {previewResult.count.toLocaleString()} customers matched
            </p>
            <p className={`text-xs ${tw.textSecondary} mt-1`}>
              Execution time: {previewResult.executionTime}ms
            </p>
          </div>
        )}

        {previewError && (
          <div
            className={`p-3`}
            style={{
              backgroundColor: "#fee2e2",
              borderLeft: `3px solid #ef4444`,
            }}
          >
            <p className="text-sm font-medium text-red-700">Query Error</p>
            <p className="text-xs text-red-600 mt-1">{previewError}</p>
          </div>
        )}

        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          disabled={!sql.trim() || isPreviewLoading}
          className={`px-6 py-2 text-white transition-colors text-sm font-medium w-fit disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{
            backgroundColor: color.primary.action,
          }}
        >
          {isPreviewLoading ? "Previewing..." : "Preview"}
        </button>
      </div>
    </div>
  );
}
