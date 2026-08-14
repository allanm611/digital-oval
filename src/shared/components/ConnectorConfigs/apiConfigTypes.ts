export type ApiHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type ApiAuthType = "none" | "basic" | "bearer" | "api_key";

export type ApiBodyMode = "none" | "raw" | "urlencoded" | "formdata";

export type ApiRawLanguage = "json" | "xml" | "text";

export type ApiKeyAddTo = "header" | "query";

export type ApiContentType =
  | "JSON"
  | "XML"
  | "QUERY_STRING"
  | "TEXT"
  | "FORM_DATA"
  | "NONE";

export interface ApiKeyValueRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
  /** form-data only */
  type?: "text" | "file";
}

export interface ApiAuthConfig {
  username?: string;
  password?: string;
  token?: string;
  api_key?: string;
  api_key_name?: string;
  api_key_add_to?: ApiKeyAddTo;
}

export type ApiConfigTab =
  | "params"
  | "authorization"
  | "headers"
  | "body"
  | "settings";

export const API_HTTP_METHODS: ApiHttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export const API_AUTH_OPTIONS: Array<{ value: ApiAuthType; label: string }> = [
  { value: "none", label: "No Auth" },
  { value: "basic", label: "Basic Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "api_key", label: "API Key" },
];

export const API_BODY_MODE_OPTIONS: Array<{
  value: ApiBodyMode;
  label: string;
}> = [
  { value: "none", label: "none" },
  { value: "formdata", label: "form-data" },
  { value: "urlencoded", label: "x-www-form-urlencoded" },
  { value: "raw", label: "raw" },
];

export const API_RAW_LANGUAGE_OPTIONS: Array<{
  value: ApiRawLanguage;
  label: string;
}> = [
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "text", label: "Text" },
];

export const METHOD_COLORS: Record<ApiHttpMethod, string> = {
  GET: "#10B981",
  POST: "#F59E0B",
  PUT: "#3B82F6",
  PATCH: "#0D9488",
  DELETE: "#EF4444",
  HEAD: "#8B5CF6",
  OPTIONS: "#64748B",
};
