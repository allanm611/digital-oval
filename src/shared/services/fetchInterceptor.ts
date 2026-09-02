/**
 * Global fetch interceptor for handling auth errors
 * Wraps the native fetch to catch 401 responses and logout user.
 *
 * IMPORTANT: Do NOT logout on 403. Forbidden means "authenticated but not allowed"
 * for that resource — Create Campaign and similar pages fire many optional config
 * APIs; a single 403 must not wipe the whole session and bounce the user to /login.
 */

let authLogoutCallback: (() => void) | null = null;

/**
 * Register the logout callback (called from AuthContext)
 */
export function registerAuthLogoutCallback(callback: () => void) {
  authLogoutCallback = callback;
}

/**
 * Wraps fetch to intercept auth errors (401 Unauthorized only)
 */
export async function fetchWithAuthInterceptor(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  // 401 = session invalid/expired. 403 = permission denied for this call — keep session.
  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_permissions");
    localStorage.removeItem("session_id");

    if (authLogoutCallback) {
      authLogoutCallback();
    } else {
      console.warn("Auth failed (401) but no logout callback registered");
      window.location.href = "/login";
    }
  }

  return response;
}
