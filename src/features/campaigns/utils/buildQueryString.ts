/** Build URL query string from params object, skipping null/undefined values */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === "string") {
      if (value.trim() !== "") {
        searchParams.append(key, value);
      }
    } else if (typeof value === "boolean") {
      searchParams.append(key, value ? "true" : "false");
    } else if (typeof value === "number") {
      if (!isNaN(value) && isFinite(value)) {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString() ? `?${searchParams.toString()}` : "";
}
