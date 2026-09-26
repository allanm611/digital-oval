import type { HttpMethod } from '../types/health';

export interface HttpStatusOption {
  code: number;
  reason: string;
}

/**
 * Common REST statuses offered in the API Test Builder multi-select.
 * Unusual codes from a saved case are appended at runtime so nothing is dropped.
 */
export const HTTP_STATUS_CODES: HttpStatusOption[] = [
  { code: 200, reason: 'OK' },
  { code: 201, reason: 'Created' },
  { code: 202, reason: 'Accepted' },
  { code: 204, reason: 'No Content' },
  { code: 206, reason: 'Partial Content' },
  { code: 301, reason: 'Moved Permanently' },
  { code: 302, reason: 'Found' },
  { code: 304, reason: 'Not Modified' },
  { code: 400, reason: 'Bad Request' },
  { code: 401, reason: 'Unauthorized' },
  { code: 403, reason: 'Forbidden' },
  { code: 404, reason: 'Not Found' },
  { code: 405, reason: 'Method Not Allowed' },
  { code: 408, reason: 'Request Timeout' },
  { code: 409, reason: 'Conflict' },
  { code: 410, reason: 'Gone' },
  { code: 412, reason: 'Precondition Failed' },
  { code: 415, reason: 'Unsupported Media Type' },
  { code: 422, reason: 'Unprocessable Entity' },
  { code: 429, reason: 'Too Many Requests' },
  { code: 500, reason: 'Internal Server Error' },
  { code: 502, reason: 'Bad Gateway' },
  { code: 503, reason: 'Service Unavailable' },
  { code: 504, reason: 'Gateway Timeout' },
];

export const METHOD_BADGE_CLASS: Record<HttpMethod, string> = {
  GET: 'bg-blue-50 text-blue-700 border-blue-200',
  POST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUT: 'bg-amber-50 text-amber-700 border-amber-200',
  PATCH: 'bg-orange-50 text-orange-700 border-orange-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  HEAD: 'bg-gray-50 text-gray-700 border-gray-200',
};

export const METHOD_TEXT_CLASS: Record<HttpMethod, string> = {
  GET: 'text-blue-700',
  POST: 'text-emerald-700',
  PUT: 'text-amber-700',
  PATCH: 'text-orange-700',
  DELETE: 'text-rose-700',
  HEAD: 'text-gray-700',
};

export function httpStatusLabel(code: number): string {
  const found = HTTP_STATUS_CODES.find((item) => item.code === code);
  return found ? `${found.code} ${found.reason}` : String(code);
}

export function statusBadgeClass(status: number): string {
  if (status >= 200 && status < 300) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status >= 300 && status < 400) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status >= 400 && status < 500) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (status >= 500) return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

export function defaultExpectedStatusForMethod(method: HttpMethod): number[] {
  switch (method) {
    case 'POST':
      return [200, 201];
    case 'PUT':
    case 'PATCH':
      return [200, 201, 204];
    case 'DELETE':
      return [200, 204];
    default:
      return [200];
  }
}

export function canHaveRequestBody(method: HttpMethod): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

export function buildStatusSelectOptions(extraCodes: number[] = []) {
  const seen = new Set(HTTP_STATUS_CODES.map((item) => item.code));
  const extras = extraCodes.filter((code) => Number.isInteger(code) && !seen.has(code));
  return [
    ...HTTP_STATUS_CODES.map((item) => ({
      id: item.code,
      value: item.code,
      label: `${item.code} ${item.reason}`,
    })),
    ...extras.map((code) => ({
      id: code,
      value: code,
      label: String(code),
    })),
  ];
}
