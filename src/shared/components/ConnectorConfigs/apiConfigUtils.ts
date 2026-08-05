import type {
  ApiAuthConfig,
  ApiAuthType,
  ApiBodyMode,
  ApiContentType,
  ApiHttpMethod,
  ApiKeyValueRow,
  ApiRawLanguage,
} from "./apiConfigTypes";

export function createEmptyRow(
  overrides: Partial<ApiKeyValueRow> = {},
): ApiKeyValueRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    key: "",
    value: "",
    enabled: true,
    description: "",
    ...overrides,
  };
}

export function ensureTrailingEmptyRow(rows: ApiKeyValueRow[]): ApiKeyValueRow[] {
  if (rows.length === 0) return [createEmptyRow()];
  const last = rows[rows.length - 1];
  if (last.key === "" && last.value === "") return rows;
  return [...rows, createEmptyRow()];
}

export function stripEmptyTrailingRows(rows: ApiKeyValueRow[]): ApiKeyValueRow[] {
  const next = [...rows];
  while (
    next.length > 0 &&
    next[next.length - 1].key === "" &&
    next[next.length - 1].value === ""
  ) {
    next.pop();
  }
  return next;
}

export function rowsToRecord(
  rows: ApiKeyValueRow[],
  onlyEnabled = true,
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const row of rows) {
    if (!row.key.trim()) continue;
    if (onlyEnabled && !row.enabled) continue;
    record[row.key.trim()] = row.value ?? "";
  }
  return record;
}

export function recordToRows(
  record: Record<string, string> | undefined | null,
): ApiKeyValueRow[] {
  if (!record || typeof record !== "object") return [createEmptyRow()];
  const rows = Object.entries(record).map(([key, value]) =>
    createEmptyRow({ key, value: String(value ?? ""), enabled: true }),
  );
  return ensureTrailingEmptyRow(rows);
}

/** Split URL into base (without query) and query string */
export function splitUrlAndQuery(url: string): {
  base: string;
  query: string;
} {
  const trimmed = url || "";
  const hashIndex = trimmed.indexOf("#");
  const withoutHash =
    hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const qIndex = withoutHash.indexOf("?");
  if (qIndex < 0) {
    return { base: withoutHash, query: "" };
  }
  return {
    base: withoutHash.slice(0, qIndex),
    query: withoutHash.slice(qIndex + 1),
  };
}

export function parseQueryString(query: string): ApiKeyValueRow[] {
  if (!query) return [createEmptyRow()];
  const rows: ApiKeyValueRow[] = [];
  const parts = query.split("&").filter(Boolean);
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) {
      rows.push(
        createEmptyRow({
          key: decodeURIComponentSafe(part),
          value: "",
          enabled: true,
        }),
      );
    } else {
      rows.push(
        createEmptyRow({
          key: decodeURIComponentSafe(part.slice(0, eq)),
          value: decodeURIComponentSafe(part.slice(eq + 1)),
          enabled: true,
        }),
      );
    }
  }
  return ensureTrailingEmptyRow(rows);
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function encodeURIComponentSafe(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

/** Build query string from enabled params with keys */
export function buildQueryString(rows: ApiKeyValueRow[]): string {
  return rows
    .filter((row) => row.enabled && row.key.trim())
    .map(
      (row) =>
        `${encodeURIComponentSafe(row.key.trim())}=${encodeURIComponentSafe(row.value ?? "")}`,
    )
    .join("&");
}

/**
 * Postman-style: merge URL query into param rows.
 * Preserves disabled params that are not present in the URL.
 */
export function syncParamsFromUrl(
  url: string,
  existingParams: ApiKeyValueRow[],
): ApiKeyValueRow[] {
  const { query } = splitUrlAndQuery(url);
  const fromUrl = parseQueryString(query);
  const urlKeys = new Set(
    fromUrl.filter((r) => r.key.trim()).map((r) => r.key.trim()),
  );

  const preservedDisabled = stripEmptyTrailingRows(existingParams).filter(
    (row) => row.key.trim() && !row.enabled && !urlKeys.has(row.key.trim()),
  );

  return ensureTrailingEmptyRow([
    ...stripEmptyTrailingRows(fromUrl),
    ...preservedDisabled,
  ]);
}

export function applyParamsToUrl(
  url: string,
  params: ApiKeyValueRow[],
): string {
  const { base } = splitUrlAndQuery(url);
  const qs = buildQueryString(params);
  if (!base && !qs) return url || "";
  return qs ? `${base}?${qs}` : base;
}

export function extractHostFromUrl(url: string): string {
  try {
    const normalized =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    return new URL(normalized).host;
  } catch {
    return "";
  }
}

export function inferAuthType(config: Record<string, any>): ApiAuthType {
  if (config.auth_type) return config.auth_type as ApiAuthType;
  if (config.api_key) return "api_key";
  if (config.username || config.password) {
    // Bearer tokens were historically stored in password with empty username
    if (!config.username && config.password) return "bearer";
    return "basic";
  }
  return "none";
}

export function getAuthConfig(config: Record<string, any>): ApiAuthConfig {
  const auth = (config.auth_config || {}) as ApiAuthConfig;
  const authType = inferAuthType(config);

  if (authType === "basic") {
    return {
      username: auth.username ?? config.username ?? "",
      password: auth.password ?? config.password ?? "",
    };
  }
  if (authType === "bearer") {
    return {
      token: auth.token ?? config.bearer_token ?? config.password ?? "",
    };
  }
  if (authType === "api_key") {
    return {
      api_key: auth.api_key ?? config.api_key ?? "",
      api_key_name: auth.api_key_name ?? config.api_key_name ?? "X-API-Key",
      api_key_add_to: auth.api_key_add_to ?? config.api_key_add_to ?? "header",
    };
  }
  return {};
}

/**
 * Build persisted auth fields + derived Authorization / API-key headers.
 * Mirrors Postman: auth credentials are source of truth; Authorization header
 * is generated for basic/bearer when not manually overridden.
 */
export function buildAuthPatch(
  authType: ApiAuthType,
  authConfig: ApiAuthConfig,
  headerRows: ApiKeyValueRow[],
  queryParams: ApiKeyValueRow[],
): {
  auth_type: ApiAuthType;
  auth_config: ApiAuthConfig;
  username?: string;
  password?: string;
  bearer_token?: string;
  api_key?: string;
  api_key_name?: string;
  api_key_add_to?: string;
  header_rows: ApiKeyValueRow[];
  query_params: ApiKeyValueRow[];
  request_headers: Record<string, string>;
} {
  const managedHeaderNames = new Set([
    "authorization",
    (authConfig.api_key_name || "x-api-key").toLowerCase(),
  ]);

  let nextHeaders = headerRows.filter(
    (row) => !managedHeaderNames.has(row.key.trim().toLowerCase()) || !row.key.trim(),
  );
  // Keep non-auth rows; re-add generated auth headers as disabled "auto" style
  nextHeaders = stripEmptyTrailingRows(nextHeaders);

  let nextParams = [...queryParams];

  // Remove previously injected API key query params by name
  const apiKeyName = (authConfig.api_key_name || "X-API-Key").trim();
  if (authType !== "api_key" || authConfig.api_key_add_to !== "query") {
    nextParams = nextParams.filter(
      (row) =>
        row.key.trim().toLowerCase() !== apiKeyName.toLowerCase() ||
        !row.description?.includes("__auth_api_key__"),
    );
  }

  const patch: ReturnType<typeof buildAuthPatch> = {
    auth_type: authType,
    auth_config: authConfig,
    username: "",
    password: "",
    bearer_token: "",
    api_key: "",
    api_key_name: apiKeyName,
    api_key_add_to: authConfig.api_key_add_to || "header",
    header_rows: ensureTrailingEmptyRow(nextHeaders),
    query_params: ensureTrailingEmptyRow(nextParams),
    request_headers: {},
  };

  if (authType === "basic") {
    patch.username = authConfig.username || "";
    patch.password = authConfig.password || "";
    if (patch.username || patch.password) {
      const token =
        typeof btoa !== "undefined"
          ? btoa(`${patch.username}:${patch.password}`)
          : "";
      nextHeaders = [
        ...stripEmptyTrailingRows(nextHeaders),
        createEmptyRow({
          key: "Authorization",
          value: token ? `Basic ${token}` : "Basic ",
          enabled: true,
          description: "__auth_basic__",
        }),
      ];
    }
  } else if (authType === "bearer") {
    const token = authConfig.token || "";
    patch.bearer_token = token;
    // Legacy compatibility: many connectors read password as token
    patch.password = token;
    if (token) {
      nextHeaders = [
        ...stripEmptyTrailingRows(nextHeaders),
        createEmptyRow({
          key: "Authorization",
          value: `Bearer ${token}`,
          enabled: true,
          description: "__auth_bearer__",
        }),
      ];
    }
  } else if (authType === "api_key") {
    const keyValue = authConfig.api_key || "";
    patch.api_key = keyValue;
    if (keyValue && apiKeyName) {
      if ((authConfig.api_key_add_to || "header") === "query") {
        nextParams = [
          ...stripEmptyTrailingRows(nextParams).filter(
            (row) =>
              row.key.trim().toLowerCase() !== apiKeyName.toLowerCase() ||
              !row.description?.includes("__auth_api_key__"),
          ),
          createEmptyRow({
            key: apiKeyName,
            value: keyValue,
            enabled: true,
            description: "__auth_api_key__",
          }),
        ];
      } else {
        nextHeaders = [
          ...stripEmptyTrailingRows(nextHeaders),
          createEmptyRow({
            key: apiKeyName,
            value: keyValue,
            enabled: true,
            description: "__auth_api_key__",
          }),
        ];
      }
    }
  }

  patch.header_rows = ensureTrailingEmptyRow(nextHeaders);
  patch.query_params = ensureTrailingEmptyRow(nextParams);
  patch.request_headers = rowsToRecord(patch.header_rows, true);
  return patch;
}

export function inferBodyMode(config: Record<string, any>): ApiBodyMode {
  if (config.body_mode) return config.body_mode as ApiBodyMode;
  const ct = String(config.content_type || "").toUpperCase();
  if (ct === "QUERY_STRING" || ct === "FORM_URLENCODED") return "urlencoded";
  if (ct === "FORM_DATA") return "formdata";
  if (ct === "NONE") return "none";
  if (config.payload_template) return "raw";
  if (ct === "JSON" || ct === "XML" || ct === "TEXT") return "raw";
  return "none";
}

export function inferRawLanguage(config: Record<string, any>): ApiRawLanguage {
  if (config.raw_language) return config.raw_language as ApiRawLanguage;
  const ct = String(config.content_type || "").toUpperCase();
  if (ct === "XML") return "xml";
  if (ct === "TEXT") return "text";
  return "json";
}

export function contentTypeFromBody(
  bodyMode: ApiBodyMode,
  rawLanguage: ApiRawLanguage,
): ApiContentType {
  if (bodyMode === "none") return "NONE";
  if (bodyMode === "urlencoded") return "QUERY_STRING";
  if (bodyMode === "formdata") return "FORM_DATA";
  if (rawLanguage === "xml") return "XML";
  if (rawLanguage === "text") return "TEXT";
  return "JSON";
}

export function serializeUrlEncoded(rows: ApiKeyValueRow[]): string {
  return buildQueryString(rows);
}

export function parseUrlEncodedBody(body: string): ApiKeyValueRow[] {
  return parseQueryString(body || "");
}

export function serializeFormData(rows: ApiKeyValueRow[]): string {
  // Persist as JSON array for engine consumption; also keep payload_template
  return JSON.stringify(
    stripEmptyTrailingRows(rows)
      .filter((r) => r.enabled && r.key.trim())
      .map((r) => ({
        key: r.key.trim(),
        value: r.value,
        type: r.type || "text",
      })),
  );
}

export function parseFormDataBody(body: string): ApiKeyValueRow[] {
  if (!body?.trim()) return [createEmptyRow({ type: "text" })];
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      return ensureTrailingEmptyRow(
        parsed.map((item) =>
          createEmptyRow({
            key: String(item.key ?? ""),
            value: String(item.value ?? ""),
            enabled: true,
            type: item.type === "file" ? "file" : "text",
          }),
        ),
      );
    }
  } catch {
    // fall through
  }
  return [createEmptyRow({ type: "text" })];
}

export function buildBodyPatch(
  bodyMode: ApiBodyMode,
  rawLanguage: ApiRawLanguage,
  payload: string,
  urlencodedRows: ApiKeyValueRow[],
  formDataRows: ApiKeyValueRow[],
  headerRows: ApiKeyValueRow[],
): {
  body_mode: ApiBodyMode;
  raw_language: ApiRawLanguage;
  content_type: ApiContentType;
  payload_template: string;
  urlencoded_params: ApiKeyValueRow[];
  form_data_params: ApiKeyValueRow[];
  header_rows: ApiKeyValueRow[];
  request_headers: Record<string, string>;
} {
  const contentType = contentTypeFromBody(bodyMode, rawLanguage);
  let payloadTemplate = "";

  if (bodyMode === "raw") {
    payloadTemplate = payload;
  } else if (bodyMode === "urlencoded") {
    payloadTemplate = serializeUrlEncoded(urlencodedRows);
  } else if (bodyMode === "formdata") {
    payloadTemplate = serializeFormData(formDataRows);
  }

  // Sync Content-Type header like Postman (auto-managed)
  const withoutContentType = stripEmptyTrailingRows(headerRows).filter(
    (row) => row.key.trim().toLowerCase() !== "content-type",
  );

  let nextHeaders = withoutContentType;
  if (bodyMode === "raw") {
    const mime =
      rawLanguage === "xml"
        ? "application/xml"
        : rawLanguage === "text"
          ? "text/plain"
          : "application/json";
    nextHeaders = [
      ...withoutContentType,
      createEmptyRow({
        key: "Content-Type",
        value: mime,
        enabled: true,
        description: "__auto_content_type__",
      }),
    ];
  } else if (bodyMode === "urlencoded") {
    nextHeaders = [
      ...withoutContentType,
      createEmptyRow({
        key: "Content-Type",
        value: "application/x-www-form-urlencoded",
        enabled: true,
        description: "__auto_content_type__",
      }),
    ];
  } else if (bodyMode === "formdata") {
    nextHeaders = [
      ...withoutContentType,
      createEmptyRow({
        key: "Content-Type",
        value: "multipart/form-data",
        enabled: true,
        description: "__auto_content_type__",
      }),
    ];
  }

  const headerRowsFinal = ensureTrailingEmptyRow(nextHeaders);
  return {
    body_mode: bodyMode,
    raw_language: rawLanguage,
    content_type: contentType,
    payload_template: payloadTemplate,
    urlencoded_params: ensureTrailingEmptyRow(urlencodedRows),
    form_data_params: ensureTrailingEmptyRow(formDataRows),
    header_rows: headerRowsFinal,
    request_headers: rowsToRecord(headerRowsFinal, true),
  };
}

export function normalizeHttpMethod(method: unknown): ApiHttpMethod {
  const upper = String(method || "GET").toUpperCase();
  const allowed: ApiHttpMethod[] = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];
  return (allowed.includes(upper as ApiHttpMethod)
    ? upper
    : "GET") as ApiHttpMethod;
}

export function isValidHttpUrl(value: string): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function initializeApiConfigState(config: Record<string, any>) {
  const baseUrl = config.base_url || config.url || "";
  const queryParams = Array.isArray(config.query_params)
    ? ensureTrailingEmptyRow(config.query_params as ApiKeyValueRow[])
    : syncParamsFromUrl(baseUrl, []);

  const headerRows = Array.isArray(config.header_rows)
    ? ensureTrailingEmptyRow(config.header_rows as ApiKeyValueRow[])
    : recordToRows(config.request_headers || config.headers);

  const bodyMode = inferBodyMode(config);
  const rawLanguage = inferRawLanguage(config);

  const urlencodedParams = Array.isArray(config.urlencoded_params)
    ? ensureTrailingEmptyRow(config.urlencoded_params as ApiKeyValueRow[])
    : bodyMode === "urlencoded"
      ? parseUrlEncodedBody(config.payload_template || "")
      : [createEmptyRow()];

  const formDataParams = Array.isArray(config.form_data_params)
    ? ensureTrailingEmptyRow(config.form_data_params as ApiKeyValueRow[])
    : bodyMode === "formdata"
      ? parseFormDataBody(config.payload_template || "")
      : [createEmptyRow({ type: "text" })];

  return {
    method: normalizeHttpMethod(config.method),
    base_url: baseUrl,
    host: config.host || extractHostFromUrl(baseUrl),
    query_params: queryParams,
    header_rows: headerRows,
    auth_type: inferAuthType(config),
    auth_config: getAuthConfig(config),
    body_mode: bodyMode,
    raw_language: rawLanguage,
    payload_template: config.payload_template || "",
    urlencoded_params: urlencodedParams,
    form_data_params: formDataParams,
  };
}
