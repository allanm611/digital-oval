import type { RunTriggerCredentials, RunTriggerPayload } from '../types/health';

/** Session-only storage — never persisted to localStorage. */
export const HEALTH_E2E_PASSWORD_SESSION_KEY = 'health_e2e_password';

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Mirrors backend `isTestAuthTokenUsable()` — expired tokens cannot drive Playwright auth. */
export function isAuthTokenUsable(token: string | null | undefined): boolean {
  const trimmed = token?.trim();
  if (!trimmed) return false;

  const payload = decodeJwtPayload(trimmed);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;
  return !exp || Date.now() / 1000 <= exp;
}

export function getStoredE2ePassword(): string | undefined {
  try {
    return nonEmpty(sessionStorage.getItem(HEALTH_E2E_PASSWORD_SESSION_KEY));
  } catch {
    return undefined;
  }
}

export function setStoredE2ePassword(password: string): void {
  sessionStorage.setItem(HEALTH_E2E_PASSWORD_SESSION_KEY, password);
}

export function clearStoredE2ePassword(): void {
  sessionStorage.removeItem(HEALTH_E2E_PASSWORD_SESSION_KEY);
}

export interface BuildRunAuthPayloadOptions {
  /** Module `baseUrl` — used as Playwright `frontendUrl` when set. */
  baseUrl?: string;
  /** Active session token (prefer `useAuth().token` over a stale localStorage read). */
  authToken?: string | null;
}

/**
 * Builds the POST body for `POST /v1/run/:moduleId`.
 * Includes a nested `credentials` object (REST-compatible) plus flat fields.
 */
export function buildRunAuthPayload(
  options?: BuildRunAuthPayloadOptions,
): RunTriggerPayload {
  const authToken =
    nonEmpty(options?.authToken ?? undefined) ??
    nonEmpty(localStorage.getItem('authToken')) ??
    nonEmpty(localStorage.getItem('auth_token'));

  const sessionId = nonEmpty(localStorage.getItem('session_id')) ?? '';

  const authUser = safeParseJson<Record<string, unknown>>(
    localStorage.getItem('auth_user'),
    {},
  );

  const authPermissions = safeParseJson<string[]>(
    localStorage.getItem('auth_permissions'),
    [],
  );

  const email =
    nonEmpty(typeof authUser.email === 'string' ? authUser.email : undefined);

  const e2ePassword = getStoredE2ePassword();

  const credentials: RunTriggerCredentials = {
    ...(email ? { email } : {}),
    ...(e2ePassword ? { password: e2ePassword } : {}),
    ...(authToken ? { auth_token: authToken } : {}),
    ...(sessionId ? { session_id: sessionId } : {}),
    auth_user: authUser,
    auth_permissions: authPermissions,
  };

  const payload: RunTriggerPayload = {
    credentials,
    frontendUrl: nonEmpty(options?.baseUrl) ?? window.location.origin,
    auth_user: authUser,
    auth_permissions: authPermissions,
  };

  if (authToken) {
    payload.auth_token = authToken;
  }
  if (sessionId) {
    payload.session_id = sessionId;
  }
  if (email) {
    payload.email = email;
  }
  if (e2ePassword) {
    payload.password = e2ePassword;
  }

  return payload;
}

/** Playwright login specs need a usable JWT or email+password (same rules as backend helpers). */
export function canRunAuthenticatedPlaywrightTests(payload: RunTriggerPayload): boolean {
  const token =
    nonEmpty(payload.auth_token) ??
    nonEmpty(payload.credentials?.auth_token);

  if (isAuthTokenUsable(token)) {
    return true;
  }

  const email =
    nonEmpty(payload.email) ??
    nonEmpty(payload.credentials?.email) ??
    nonEmpty(
      typeof payload.auth_user?.email === 'string' ? payload.auth_user.email : undefined,
    );

  const password =
    nonEmpty(payload.password) ?? nonEmpty(payload.credentials?.password);

  return Boolean(email && password);
}

export function validateRunAuthForPlaywright(payload: RunTriggerPayload): void {
  if (canRunAuthenticatedPlaywrightTests(payload)) {
    return;
  }

  const token =
    nonEmpty(payload.auth_token) ??
    nonEmpty(payload.credentials?.auth_token);

  if (token && !isAuthTokenUsable(token)) {
    throw new Error(
      'Your session token has expired. Sign in again, or set an E2E password under Health Check → Notifications.',
    );
  }

  throw new Error(
    'Playwright needs a valid auth token or E2E email/password. Sign in again, or save an E2E password under Health Check → Notifications (used only for test runs in this browser session).',
  );
}

/** True when any session material exists (API gate — stricter check is validateRunAuthForPlaywright). */
export function hasRunAuthMaterial(payload: RunTriggerPayload): boolean {
  const hasUserEmail =
    typeof payload.auth_user?.email === 'string' &&
    payload.auth_user.email.trim().length > 0;

  const token =
    nonEmpty(payload.auth_token) ?? nonEmpty(payload.credentials?.auth_token);

  return Boolean(
    token ||
      payload.session_id?.trim() ||
      payload.email?.trim() ||
      payload.password?.trim() ||
      payload.credentials?.password?.trim() ||
      hasUserEmail,
  );
}
