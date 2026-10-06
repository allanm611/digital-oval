import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Textarea from "../../../shared/components/ui/Textarea";
import { color, tw } from "../../../shared/utils/utils";
import {
  coerceJsonParamValue,
  createJsonParamRow,
  JSON_PARAM_KIND_OPTIONS,
  jsonParametersToRows,
  JsonParamRow,
  JsonValueKind,
  rowsToJsonParameters,
  sanitizeJsonParamValue,
  valuePlaceholder,
} from "../utils/jsonParameters";

const DEFAULT_KINDS = JSON_PARAM_KIND_OPTIONS.map((option) => option.value);

interface JsonParameterEditorProps {
  label: string;
  description: string;
  example: string;
  value: string;
  onChange: (value: string) => void;
  onIssue?: (message: string) => void;
  valueKinds?: JsonValueKind[];
}

export default function JsonParameterEditor({
  label,
  description,
  example,
  value,
  onChange,
  onIssue,
  valueKinds = DEFAULT_KINDS,
}: JsonParameterEditorProps) {
  const initial = jsonParametersToRows(value);
  const [mode, setMode] = useState<"fields" | "raw">(initial.ok ? "fields" : "raw");
  const [rows, setRows] = useState<JsonParamRow[]>(
    initial.ok ? initial.rows : [createJsonParamRow()],
  );
  const [confirmReplace, setConfirmReplace] = useState(false);
  const emitted = useRef(value);
  const onIssueRef = useRef(onIssue);
  const reportedIssue = useRef("");
  onIssueRef.current = onIssue;

  useEffect(
    () => () => {
      reportedIssue.current = "";
      onIssueRef.current?.("");
    },
    [],
  );

  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    const parsed = jsonParametersToRows(value);
    if (parsed.ok) {
      setRows(parsed.rows);
      setMode("fields");
      setConfirmReplace(false);
      return;
    }
    setMode("raw");
  }, [value]);

  const built = useMemo(() => rowsToJsonParameters(rows), [rows]);
  const issueByRow = useMemo(() => {
    const map = new Map<string, string>();
    built.issues.forEach((issue) => {
      if (issue.rowId && !map.has(issue.rowId)) map.set(issue.rowId, issue.message);
    });
    return map;
  }, [built.issues]);

  useEffect(() => {
    const message = mode === "fields" ? built.issues[0]?.message || "" : "";
    if (reportedIssue.current === message) return;
    reportedIssue.current = message;
    onIssueRef.current?.(message);
  }, [built.issues, mode]);

  const kinds = JSON_PARAM_KIND_OPTIONS.filter(
    (option) =>
      valueKinds.includes(option.value) ||
      rows.some((row) => row.kind === option.value),
  );
  const showKind = kinds.length > 1;

  const emitRows = (nextRows: JsonParamRow[]) => {
    const next = rowsToJsonParameters(nextRows);
    emitted.current = next.json;
    setRows(nextRows);
    onChange(next.json);
  };

  const updateRow = (id: string, patch: Partial<JsonParamRow>) => {
    emitRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const changeKind = (row: JsonParamRow, kind: JsonValueKind) => {
    updateRow(row.id, { kind, value: coerceJsonParamValue(kind, row.value) });
  };

  const useFields = (replace: boolean) => {
    const parsed = jsonParametersToRows(value);
    if (!parsed.ok && !replace) {
      setConfirmReplace(true);
      return;
    }
    const nextRows = parsed.ok ? parsed.rows : [createJsonParamRow()];
    emitted.current = parsed.ok ? value : "";
    setRows(nextRows);
    setMode("fields");
    setConfirmReplace(false);
    if (!parsed.ok) onChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        {mode === "fields" ? (
          <button
            type="button"
            onClick={() => setMode("raw")}
            className="shrink-0 text-sm font-medium text-red-400 hover:text-red-500"
          >
            Edit the JSON directly
          </button>
        ) : (
          <button
            type="button"
            onClick={() => useFields(false)}
            className="shrink-0 text-sm font-medium text-red-400 hover:text-red-500"
          >
            Build the JSON from fields
          </button>
        )}
      </div>

      {mode === "fields" ? (
        <>
          <div className={`${tw.rounded} overflow-hidden border border-gray-200`}>
            <div
              className={`hidden bg-gray-50 text-xs font-medium text-gray-500 sm:grid ${
                showKind
                  ? "grid-cols-[minmax(0,1fr)_11.5rem_minmax(0,1.2fr)_2.5rem]"
                  : "grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_2.5rem]"
              }`}
            >
              <span className="px-3 py-2">Name</span>
              {showKind && <span className="px-3 py-2">Format</span>}
              <span className="px-3 py-2">Value</span>
              <span />
            </div>
            {rows.map((row) => {
              const rowIssue = issueByRow.get(row.id);
              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-1 gap-2 border-t border-gray-100 p-2 first:border-t-0 sm:items-center sm:gap-0 sm:p-0 ${
                    showKind
                      ? "sm:grid-cols-[minmax(0,1fr)_11.5rem_minmax(0,1.2fr)_2.5rem]"
                      : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_2.5rem]"
                  } ${rowIssue ? "bg-red-50" : ""}`}
                >
                  <input
                    value={row.key}
                    onChange={(event) => updateRow(row.id, { key: event.target.value })}
                    onBlur={() => {
                      const named = row.key.trim().replace(/^:/, "");
                      if (named !== row.key) updateRow(row.id, { key: named });
                    }}
                    placeholder="Name"
                    aria-label="Parameter name"
                    className="min-w-0 border-0 bg-transparent px-2 py-2 text-sm focus:outline-none focus:ring-0"
                  />
                  {showKind && (
                    <select
                      value={row.kind}
                      onChange={(event) =>
                        changeKind(row, event.target.value as JsonValueKind)
                      }
                      aria-label={`Format for ${row.key || "parameter"}`}
                      className="h-9 border-0 bg-transparent px-2 text-sm focus:outline-none focus:ring-0"
                    >
                      {kinds.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <ParameterValueInput
                    row={row}
                    onChange={(next) => updateRow(row.id, { value: next })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const remaining = rows.filter((item) => item.id !== row.id);
                      emitRows(remaining.length > 0 ? remaining : [createJsonParamRow()]);
                    }}
                    className="flex items-center justify-center text-gray-400 hover:text-red-600"
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
            onClick={() => emitRows([...rows, createJsonParamRow()])}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white ${tw.rounded}`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4" />
            Add field
          </button>
        </>
      ) : (
        <Textarea
          label="JSON"
          rows={6}
          value={value}
          onChange={(next) => {
            emitted.current = next;
            onChange(next);
          }}
          placeholder={example}
          className="font-mono"
        />
      )}

      {mode === "raw" && confirmReplace && (
        <div className="space-y-2">
          <p className="text-xs text-amber-700">
            This value is nested or not a JSON object, so the fields cannot
            open it. Replacing it clears the current JSON.
          </p>
          <button
            type="button"
            onClick={() => useFields(true)}
            className="text-xs font-medium text-amber-800 hover:text-black"
          >
            Replace with empty fields
          </button>
        </div>
      )}
    </div>
  );
}

function datetimeInputValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value.length > 19 ? value.slice(0, 19) : value;
}

function ParameterValueInput({
  row,
  onChange,
}: {
  row: JsonParamRow;
  onChange: (value: string) => void;
}) {
  const className =
    "min-w-0 w-full border-0 bg-transparent px-2 py-2 text-sm focus:outline-none focus:ring-0 disabled:text-gray-400";

  if (row.kind === "boolean") {
    return (
      <select
        value={row.value === "false" ? "false" : "true"}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`Value for ${row.key || "parameter"}`}
        className="h-9 border-0 bg-transparent px-2 text-sm focus:outline-none focus:ring-0"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (row.kind === "integer") {
    return (
      <div className="px-2 py-1">
        <input
          type="number"
          step={1}
          value={row.value}
          onChange={(event) =>
            onChange(sanitizeJsonParamValue("integer", event.target.value))
          }
          placeholder="100"
          aria-label={`Value for ${row.key || "parameter"}`}
          className={`${tw.rounded} w-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-0`}
        />
      </div>
    );
  }

  if (row.kind === "null") {
    return (
      <input
        value=""
        disabled
        placeholder="null"
        aria-label={`Value for ${row.key || "parameter"}`}
        className={className}
      />
    );
  }

  if (row.kind === "date") {
    return (
      <input
        type="date"
        value={row.value}
        onChange={(event) => onChange(sanitizeJsonParamValue("date", event.target.value))}
        aria-label={`Value for ${row.key || "parameter"}`}
        className={className}
      />
    );
  }

  if (row.kind === "datetime") {
    return (
      <input
        type="datetime-local"
        step={1}
        value={datetimeInputValue(row.value)}
        onChange={(event) =>
          onChange(sanitizeJsonParamValue("datetime", event.target.value))
        }
        aria-label={`Value for ${row.key || "parameter"}`}
        className={className}
      />
    );
  }

  if (row.kind === "time") {
    return (
      <input
        type="time"
        step={1}
        value={/^\d{2}:\d{2}$/.test(row.value) ? `${row.value}:00` : row.value}
        onChange={(event) => onChange(sanitizeJsonParamValue("time", event.target.value))}
        aria-label={`Value for ${row.key || "parameter"}`}
        className={className}
      />
    );
  }

  return (
    <input
      type="text"
      inputMode={row.kind === "integer" || row.kind === "decimal" ? "decimal" : "text"}
      value={row.value}
      onChange={(event) => onChange(sanitizeJsonParamValue(row.kind, event.target.value))}
      placeholder={valuePlaceholder(row.kind)}
      aria-label={`Value for ${row.key || "parameter"}`}
      className={className}
    />
  );
}
