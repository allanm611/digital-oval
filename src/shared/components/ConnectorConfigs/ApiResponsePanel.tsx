import React, { useMemo, useState } from "react";
import { Clock, HardDrive, Server } from "lucide-react";
import { color } from "../../utils/utils";
import { formatBodyForDisplay } from "./apiProbe";
import type {
  ApiBodyViewMode,
  ApiProbeResult,
  ApiProbeStatus,
  ApiResponseViewTab,
} from "./apiProbeTypes";

function statusColor(code?: number, ok?: boolean): string {
  if (code == null) return ok ? "#10B981" : "#EF4444";
  if (code >= 200 && code < 300) return "#10B981";
  if (code >= 300 && code < 400) return "#F59E0B";
  if (code >= 400 && code < 500) return "#F97316";
  if (code >= 500) return "#EF4444";
  return "#64748B";
}

function formatBytes(bytes?: number): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(ms?: number): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function EmptyResponseState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-gray-700">
        Click Send to get a response
      </p>
      <p className="mt-2 max-w-md text-xs text-gray-500">
        The request is executed server-side (like a Postman proxy) so proxy
        settings and non-CORS APIs still work. Status, timing, headers, and body
        appear here.
      </p>
    </div>
  );
}

function SendingState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-gray-200 bg-white px-6 py-10 text-center">
      <div
        className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-transparent"
        style={{ borderTopColor: color.primary.action }}
      />
      <p className="text-sm font-medium text-gray-700">Sending request…</p>
      <p className="mt-1 text-xs text-gray-500">
        Waiting for the connection probe to finish.
      </p>
    </div>
  );
}

export const ApiResponsePanel: React.FC<{
  status: ApiProbeStatus;
  result: ApiProbeResult | null;
  onClear?: () => void;
}> = ({ status, result, onClear }) => {
  const [activeTab, setActiveTab] = useState<ApiResponseViewTab>("body");
  const [bodyMode, setBodyMode] = useState<ApiBodyViewMode>("pretty");

  const bodyText = useMemo(
    () => formatBodyForDisplay(result?.body, bodyMode),
    [result?.body, bodyMode],
  );

  const tabs: Array<{ id: ApiResponseViewTab; label: string; count?: number }> =
    [
      { id: "body", label: "Body" },
      {
        id: "headers",
        label: "Headers",
        count: result?.headers?.length || undefined,
      },
      { id: "meta", label: "Test result" },
    ];

  return (
    <div className="space-y-3 border-t border-gray-200 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Response</h4>
          <p className="text-xs text-gray-500">
            Live probe result for the configured API request.
          </p>
        </div>

        {result && status !== "sending" && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{
                color: statusColor(result.statusCode, result.ok),
              }}
            >
              {result.statusCode != null
                ? `${result.statusCode}${result.statusText ? ` ${result.statusText}` : ""}`
                : result.ok
                  ? "Success"
                  : "Failed"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {formatDuration(result.durationMs)}
            </span>
            <span className="inline-flex items-center gap-1">
              <HardDrive size={12} />
              {formatBytes(result.sizeBytes)}
            </span>
            <span className="inline-flex items-center gap-1 capitalize">
              <Server size={12} />
              {result.source}
            </span>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {status === "idle" && !result && <EmptyResponseState />}
      {status === "sending" && <SendingState />}

      {result && status !== "sending" && (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          {result.successMatch && (
            <div
              className={`border-b px-4 py-2 text-xs ${
                result.successMatch.matched
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                  : "border-amber-100 bg-amber-50 text-amber-800"
              }`}
            >
              <span className="font-semibold">
                Success criteria{" "}
                {result.successMatch.matched ? "matched" : "not matched"}
              </span>
              {result.successMatch.criteria && (
                <span className="ml-1">
                  — looking for “{result.successMatch.criteria}”
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-2">
            <nav className="-mb-px flex gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {tab.label}
                      {tab.count != null && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">
                          {tab.count}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <span
                        className="absolute inset-x-1 bottom-0 h-0.5 rounded-full"
                        style={{ backgroundColor: color.primary.action }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {activeTab === "body" && (
              <div className="flex items-center gap-1 pr-2">
                {(["pretty", "raw"] as ApiBodyViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBodyMode(mode)}
                    className={`rounded px-2 py-1 text-xs font-medium capitalize ${
                      bodyMode === mode
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-[200px] max-h-[420px] overflow-auto bg-gray-50">
            {activeTab === "body" && (
              <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs text-gray-800">
                {bodyText || (
                  <span className="text-gray-400">Empty response body</span>
                )}
              </pre>
            )}

            {activeTab === "headers" && (
              <div className="divide-y divide-gray-100 bg-white">
                {result.headers.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">
                    No response headers were returned by the probe. The backend
                    may only expose status / message for this connector type.
                  </p>
                ) : (
                  result.headers.map((header) => (
                    <div
                      key={`${header.key}-${header.value}`}
                      className="grid grid-cols-1 gap-1 px-4 py-2 text-sm md:grid-cols-[220px_1fr]"
                    >
                      <span className="font-medium text-gray-700">
                        {header.key}
                      </span>
                      <span className="break-all text-gray-600">
                        {header.value}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "meta" && (
              <div className="space-y-3 p-4 text-sm text-gray-700">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Outcome
                    </p>
                    <p className="mt-1 font-medium">
                      {result.ok ? "Healthy / accepted" : "Failed / unhealthy"}
                    </p>
                    {result.message && (
                      <p className="mt-1 text-xs text-gray-500">
                        {result.message}
                      </p>
                    )}
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Timing
                    </p>
                    <p className="mt-1 font-medium">
                      {formatDuration(result.durationMs)}
                    </p>
                    {result.startedAt && (
                      <p className="mt-1 text-xs text-gray-500">
                        Started {new Date(result.startedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {result.errorDetails && (
                  <div className="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                    {result.errorDetails}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
