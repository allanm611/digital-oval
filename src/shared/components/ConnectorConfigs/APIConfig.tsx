import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import HeadlessSelect from "../ui/HeadlessSelect";
import Checkbox from "../ui/Checkbox";
import { color, tw } from "../../utils/utils";
import { ConfigComponentProps } from "./types";
import {
  API_AUTH_OPTIONS,
  API_BODY_MODE_OPTIONS,
  API_HTTP_METHODS,
  API_RAW_LANGUAGE_OPTIONS,
  METHOD_COLORS,
  type ApiAuthConfig,
  type ApiAuthType,
  type ApiBodyMode,
  type ApiConfigTab,
  type ApiHttpMethod,
  type ApiKeyValueRow,
  type ApiRawLanguage,
} from "./apiConfigTypes";
import {
  applyParamsToUrl,
  buildAuthPatch,
  buildBodyPatch,
  createEmptyRow,
  ensureTrailingEmptyRow,
  extractHostFromUrl,
  initializeApiConfigState,
  rowsToRecord,
  syncParamsFromUrl,
} from "./apiConfigUtils";

type PatchFn = (updates: Record<string, unknown>) => void;

function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  showDescription = true,
  showType = false,
}: {
  rows: ApiKeyValueRow[];
  onChange: (rows: ApiKeyValueRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  showDescription?: boolean;
  showType?: boolean;
}) {
  const updateRow = (id: string, patch: Partial<ApiKeyValueRow>) => {
    const next = rows.map((row) =>
      row.id === id ? { ...row, ...patch } : row,
    );
    onChange(ensureTrailingEmptyRow(next));
  };

  const removeRow = (id: string) => {
    const next = rows.filter((row) => row.id !== id);
    onChange(ensureTrailingEmptyRow(next.length ? next : [createEmptyRow()]));
  };

  const addRow = () => {
    onChange(ensureTrailingEmptyRow([...rows, createEmptyRow()]));
  };

  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <div
        className="grid gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
        style={{
          gridTemplateColumns: showType
            ? "28px 1fr 100px 1fr 1fr 32px"
            : showDescription
              ? "28px 1fr 1fr 1fr 32px"
              : "28px 1fr 1fr 32px",
          backgroundColor: color.surface.tableHeader,
          color: color.surface.tableHeaderText,
        }}
      >
        <span />
        <span>Key</span>
        {showType && <span>Type</span>}
        <span>Value</span>
        {showDescription && <span>Description</span>}
        <span />
      </div>
      <div className="divide-y divide-gray-100 bg-white">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid items-center gap-2 px-3 py-2"
            style={{
              gridTemplateColumns: showType
                ? "28px 1fr 100px 1fr 1fr 32px"
                : showDescription
                  ? "28px 1fr 1fr 1fr 32px"
                  : "28px 1fr 1fr 32px",
            }}
          >
            <Checkbox
              id={`kv-enabled-${row.id}`}
              checked={row.enabled}
              onChange={() => updateRow(row.id, { enabled: !row.enabled })}
              className="h-4 w-4"
            />
            <input
              className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-gray-800 outline-none hover:border-gray-200 focus:border-gray-300"
              placeholder={keyPlaceholder}
              value={row.key}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
            />
            {showType && (
              <select
                className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700"
                value={row.type || "text"}
                onChange={(e) =>
                  updateRow(row.id, {
                    type: e.target.value === "file" ? "file" : "text",
                  })
                }
              >
                <option value="text">Text</option>
                <option value="file">File</option>
              </select>
            )}
            <input
              className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-gray-800 outline-none hover:border-gray-200 focus:border-gray-300"
              placeholder={valuePlaceholder}
              value={row.value}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
            />
            {showDescription && (
              <input
                className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-gray-500 outline-none hover:border-gray-200 focus:border-gray-300"
                placeholder="Description"
                value={row.description || ""}
                onChange={(e) =>
                  updateRow(row.id, { description: e.target.value })
                }
              />
            )}
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove row"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <Plus size={14} />
          Add row
        </button>
      </div>
    </div>
  );
}

export const APIConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
  patchConfiguration,
  hydrateKey,
}) => {
  const patch: PatchFn =
    patchConfiguration ||
    ((updates) => {
      Object.entries(updates).forEach(([key, value]) =>
        updateConfiguration(key, value),
      );
    });

  const [activeTab, setActiveTab] = useState<ApiConfigTab>("params");
  const lastHydrateKey = useRef<string | undefined>(undefined);

  const initialState = useMemo(
    () => initializeApiConfigState(config || {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial snapshot only
    [],
  );

  // Local mirrors for interactive Postman sync (URL ↔ params)
  const [urlDraft, setUrlDraft] = useState(initialState.base_url);
  const [queryParams, setQueryParams] = useState<ApiKeyValueRow[]>(
    initialState.query_params,
  );
  const [headerRows, setHeaderRows] = useState<ApiKeyValueRow[]>(
    initialState.header_rows,
  );
  const [urlencodedParams, setUrlencodedParams] = useState<ApiKeyValueRow[]>(
    initialState.urlencoded_params,
  );
  const [formDataParams, setFormDataParams] = useState<ApiKeyValueRow[]>(
    initialState.form_data_params,
  );

  // Re-hydrate only when parent signals a new source (e.g. edit profile finished loading)
  useEffect(() => {
    const key = hydrateKey ?? "default";
    if (lastHydrateKey.current === key) return;
    lastHydrateKey.current = key;

    const state = initializeApiConfigState(config || {});
    setUrlDraft(state.base_url);
    setQueryParams(state.query_params);
    setHeaderRows(state.header_rows);
    setUrlencodedParams(state.urlencoded_params);
    setFormDataParams(state.form_data_params);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional external hydrate gate
  }, [hydrateKey]);

  const method = (config.method || "GET") as ApiHttpMethod;
  const authType = (config.auth_type || "none") as ApiAuthType;
  const authConfig = (config.auth_config || {}) as ApiAuthConfig;
  const bodyMode = (config.body_mode || "none") as ApiBodyMode;
  const rawLanguage = (config.raw_language || "json") as ApiRawLanguage;

  const tabs = useMemo(() => {
    const enabledParams = queryParams.filter((r) => r.enabled && r.key.trim())
      .length;
    const enabledHeaders = headerRows.filter((r) => r.enabled && r.key.trim())
      .length;
    return [
      {
        id: "params" as const,
        label: "Params",
        count: enabledParams || undefined,
      },
      {
        id: "authorization" as const,
        label: "Authorization",
        badge: authType !== "none" ? authType : undefined,
      },
      {
        id: "headers" as const,
        label: "Headers",
        count: enabledHeaders || undefined,
      },
      {
        id: "body" as const,
        label: "Body",
        badge: bodyMode !== "none" ? bodyMode : undefined,
      },
      { id: "settings" as const, label: "Settings" },
    ];
  }, [queryParams, headerRows, authType, bodyMode]);

  const persistUrlAndParams = (nextUrl: string, nextParams: ApiKeyValueRow[]) => {
    const host = extractHostFromUrl(nextUrl);
    setUrlDraft(nextUrl);
    setQueryParams(nextParams);
    patch({
      base_url: nextUrl,
      host,
      query_params: nextParams,
    });
  };

  const handleUrlChange = (value: string) => {
    const nextParams = syncParamsFromUrl(value, queryParams);
    persistUrlAndParams(value, nextParams);
  };

  const handleParamsChange = (nextParams: ApiKeyValueRow[]) => {
    const nextUrl = applyParamsToUrl(urlDraft, nextParams);
    persistUrlAndParams(nextUrl, nextParams);
  };

  const handleMethodChange = (value: string | number) => {
    patch({ method: String(value).toUpperCase() });
  };

  const handleHeadersChange = (nextHeaders: ApiKeyValueRow[]) => {
    setHeaderRows(nextHeaders);
    patch({
      header_rows: nextHeaders,
      request_headers: rowsToRecord(nextHeaders, true),
    });
  };

  const handleAuthTypeChange = (value: string | number) => {
    const nextType = String(value) as ApiAuthType;
    const nextAuth = { ...authConfig };
    const authPatch = buildAuthPatch(
      nextType,
      nextAuth,
      headerRows,
      queryParams,
    );
    setHeaderRows(authPatch.header_rows);
    const urlWithParams = applyParamsToUrl(urlDraft, authPatch.query_params);
    setUrlDraft(urlWithParams);
    setQueryParams(authPatch.query_params);
    patch({
      ...authPatch,
      base_url: urlWithParams,
      host: extractHostFromUrl(urlWithParams),
    });
  };

  const handleAuthFieldChange = (field: keyof ApiAuthConfig, value: string) => {
    const nextAuth = { ...authConfig, [field]: value };
    const authPatch = buildAuthPatch(authType, nextAuth, headerRows, queryParams);
    setHeaderRows(authPatch.header_rows);
    const urlWithParams = applyParamsToUrl(urlDraft, authPatch.query_params);
    setUrlDraft(urlWithParams);
    setQueryParams(authPatch.query_params);
    patch({
      ...authPatch,
      base_url: urlWithParams,
      host: extractHostFromUrl(urlWithParams),
    });
  };

  const applyBody = (
    nextMode: ApiBodyMode,
    nextLanguage: ApiRawLanguage,
    payload: string,
    nextUrlencoded = urlencodedParams,
    nextFormData = formDataParams,
  ) => {
    const bodyPatch = buildBodyPatch(
      nextMode,
      nextLanguage,
      payload,
      nextUrlencoded,
      nextFormData,
      headerRows,
    );
    setHeaderRows(bodyPatch.header_rows);
    setUrlencodedParams(bodyPatch.urlencoded_params);
    setFormDataParams(bodyPatch.form_data_params);
    patch(bodyPatch);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className={`${tw.cardHeading} text-gray-900`}>API Request</h4>
          <p className="mt-1 text-sm text-gray-500">
            Configure the request the way you would in Postman — method, URL,
            params, auth, headers, and body.
          </p>
        </div>
      </div>

      {/* Postman-style method + URL bar */}
      <div className="flex overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm focus-within:border-gray-400">
        <select
          value={method}
          onChange={(e) => handleMethodChange(e.target.value)}
          className="w-[118px] shrink-0 border-0 border-r border-gray-200 bg-gray-50 px-3 py-3 text-sm font-bold outline-none"
          style={{ color: METHOD_COLORS[method] || color.text.primary }}
          aria-label="HTTP method"
        >
          {API_HTTP_METHODS.map((m) => (
            <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>
              {m}
            </option>
          ))}
        </select>
        <div className="flex min-w-0 flex-1 items-center px-3">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://api.example.com/v1/resource/:id"
            className="w-full border-0 bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-1">
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
                  {"count" in tab && tab.count != null && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">
                      {tab.count}
                    </span>
                  )}
                  {"badge" in tab && tab.badge && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium capitalize text-amber-700">
                      {tab.badge}
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
      </div>

      <div className="min-h-[220px]">
        {activeTab === "params" && (
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-semibold text-gray-800">
                Query Params
              </h5>
              <p className="text-xs text-gray-500">
                Enabled params are synced into the URL query string.
              </p>
            </div>
            <KeyValueEditor
              rows={queryParams}
              onChange={handleParamsChange}
              keyPlaceholder="Param key"
              valuePlaceholder="Param value"
            />
          </div>
        )}

        {activeTab === "authorization" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <HeadlessSelect
                label="Type"
                options={API_AUTH_OPTIONS}
                value={authType}
                onChange={handleAuthTypeChange}
              />
            </div>

            {authType === "none" && (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                This request does not use any authorization.
              </div>
            )}

            {authType === "basic" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Username"
                  value={authConfig.username || ""}
                  onChange={(value) =>
                    handleAuthFieldChange("username", String(value))
                  }
                  placeholder="Username"
                />
                <Input
                  type="password"
                  label="Password"
                  value={authConfig.password || ""}
                  onChange={(value) =>
                    handleAuthFieldChange("password", String(value))
                  }
                  placeholder="••••••••"
                />
              </div>
            )}

            {authType === "bearer" && (
              <Input
                type="password"
                label="Token"
                value={authConfig.token || ""}
                onChange={(value) =>
                  handleAuthFieldChange("token", String(value))
                }
                placeholder="Access token"
              />
            )}

            {authType === "api_key" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Key"
                  value={authConfig.api_key_name || "X-API-Key"}
                  onChange={(value) =>
                    handleAuthFieldChange("api_key_name", String(value))
                  }
                  placeholder="X-API-Key"
                />
                <Input
                  type="password"
                  label="Value"
                  value={authConfig.api_key || ""}
                  onChange={(value) =>
                    handleAuthFieldChange("api_key", String(value))
                  }
                  placeholder="API key value"
                />
                <HeadlessSelect
                  label="Add to"
                  options={[
                    { value: "header", label: "Header" },
                    { value: "query", label: "Query Params" },
                  ]}
                  value={authConfig.api_key_add_to || "header"}
                  onChange={(value) =>
                    handleAuthFieldChange("api_key_add_to", String(value))
                  }
                />
              </div>
            )}

            {authType !== "none" && (
              <p className="text-xs text-gray-500">
                Auth values are persisted for the connection and automatically
                reflected in Headers / Params (Postman behavior).
              </p>
            )}
          </div>
        )}

        {activeTab === "headers" && (
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-semibold text-gray-800">Headers</h5>
              <p className="text-xs text-gray-500">
                Content-Type and Authorization are managed when Body / Auth
                change; you can still override them here.
              </p>
            </div>
            <KeyValueEditor
              rows={headerRows}
              onChange={handleHeadersChange}
              keyPlaceholder="Header name"
              valuePlaceholder="Header value"
            />
          </div>
        )}

        {activeTab === "body" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {API_BODY_MODE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name="api-body-mode"
                    checked={bodyMode === option.value}
                    onChange={() =>
                      applyBody(
                        option.value,
                        rawLanguage,
                        config.payload_template || "",
                      )
                    }
                    className="h-4 w-4"
                  />
                  {option.label}
                </label>
              ))}

              {bodyMode === "raw" && (
                <div className="ml-auto w-40">
                  <HeadlessSelect
                    label="Language"
                    options={API_RAW_LANGUAGE_OPTIONS}
                    value={rawLanguage}
                    onChange={(value) =>
                      applyBody(
                        "raw",
                        String(value) as ApiRawLanguage,
                        config.payload_template || "",
                      )
                    }
                  />
                </div>
              )}
            </div>

            {bodyMode === "none" && (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                This request does not have a body.
              </div>
            )}

            {bodyMode === "raw" && (
              <Textarea
                label="Body"
                value={config.payload_template || ""}
                onChange={(value) =>
                  applyBody("raw", rawLanguage, String(value))
                }
                rows={10}
                placeholder={
                  rawLanguage === "xml"
                    ? "<request>\n  <id>{{id}}</id>\n</request>"
                    : rawLanguage === "text"
                      ? "plain text body"
                      : '{\n  "key": "{{value}}"\n}'
                }
                className="font-mono"
              />
            )}

            {bodyMode === "urlencoded" && (
              <KeyValueEditor
                rows={urlencodedParams}
                onChange={(rows) =>
                  applyBody(
                    "urlencoded",
                    rawLanguage,
                    config.payload_template || "",
                    rows,
                    formDataParams,
                  )
                }
                keyPlaceholder="Key"
                valuePlaceholder="Value"
                showDescription={false}
              />
            )}

            {bodyMode === "formdata" && (
              <KeyValueEditor
                rows={formDataParams}
                onChange={(rows) =>
                  applyBody(
                    "formdata",
                    rawLanguage,
                    config.payload_template || "",
                    urlencodedParams,
                    rows,
                  )
                }
                keyPlaceholder="Key"
                valuePlaceholder="Value"
                showDescription={false}
                showType
              />
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Host"
                placeholder="api.example.com"
                value={config.host || ""}
                onChange={(value) => updateConfiguration("host", value)}
              />
              <div
                className="flex items-center pt-2"
                onClick={() =>
                  updateConfiguration(
                    "enable_proxy",
                    !(config.enable_proxy || false),
                  )
                }
              >
                <Checkbox
                  id="enable_proxy"
                  checked={config.enable_proxy || false}
                  onChange={() =>
                    updateConfiguration(
                      "enable_proxy",
                      !(config.enable_proxy || false),
                    )
                  }
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm text-gray-700">Enable Proxy</span>
              </div>
            </div>

            {config.enable_proxy && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label="Proxy URL"
                  value={config.proxy_url || ""}
                  onChange={(value) =>
                    updateConfiguration("proxy_url", String(value))
                  }
                  placeholder="http://proxy.company.com:8080"
                />
                <Input
                  label="Proxy Username"
                  value={config.proxy_username || ""}
                  onChange={(value) =>
                    updateConfiguration("proxy_username", String(value))
                  }
                />
                <Input
                  type="password"
                  label="Proxy Password"
                  value={config.proxy_password || ""}
                  onChange={(value) =>
                    updateConfiguration("proxy_password", String(value))
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Input
                type="number"
                label="Response Timeout (sec)"
                value={config.response_timeout || 10}
                onChange={(value) =>
                  updateConfiguration(
                    "response_timeout",
                    parseInt(String(value), 10) || 10,
                  )
                }
                min={1}
              />
              <Input
                type="number"
                label="Thread Count"
                value={config.thread_count || 1}
                onChange={(value) =>
                  updateConfiguration(
                    "thread_count",
                    parseInt(String(value), 10) || 1,
                  )
                }
                min={1}
                max={100}
              />
              <Input
                type="number"
                label="Messages Per Second"
                value={config.messages_per_second || 10}
                onChange={(value) =>
                  updateConfiguration(
                    "messages_per_second",
                    parseInt(String(value), 10) || 10,
                  )
                }
                min={1}
                max={10000}
              />
              <Input
                type="number"
                label="Service Message Throttle"
                value={config.service_message_throttle || 1}
                onChange={(value) =>
                  updateConfiguration(
                    "service_message_throttle",
                    parseInt(String(value), 10) || 1,
                  )
                }
                min={1}
                max={100}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Success Response String(s)"
                placeholder="Success string/header/status"
                value={config.success_response || ""}
                onChange={(value) =>
                  updateConfiguration("success_response", value)
                }
              />
              <Input
                label="Result Code Path"
                placeholder="$.code or //response/code"
                value={config.result_code || ""}
                onChange={(value) =>
                  updateConfiguration("result_code", value)
                }
              />
              <Input
                label="Result Description Path"
                placeholder="$.message or //response/description"
                value={config.result_description || ""}
                onChange={(value) =>
                  updateConfiguration("result_description", value)
                }
              />
            </div>

            <Input
              label="Result Path"
              placeholder="$.data or //response/result"
              value={config.xpath || ""}
              onChange={(value) => updateConfiguration("xpath", value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
