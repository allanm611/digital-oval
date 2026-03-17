/**
 * Global fetch interceptor for handling auth errors
 * Wraps the native fetch to catch 401/403 responses and logout user
 */

let authLogoutCallback: (() => void) | null = null;

/**
 * Register the logout callback (called from AuthContext)
 */
export function registerAuthLogoutCallback(callback: () => void) {
  authLogoutCallback = callback;
}

/**
 * Wraps fetch to intercept auth errors (401/403)
 */
export async function fetchWithAuthInterceptor(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  // Check if response is 401 or 403 (auth failure)
  if (response.status === 401 || response.status === 403) {
    // Clear auth data from localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_permissions");
    localStorage.removeItem("session_id");

    // Call logout callback if registered
    if (authLogoutCallback) {
      authLogoutCallback();
    } else {
      // Fallback: reload page to show login
      console.warn("Auth failed (401/403) but no logout callback registered");
      window.location.href = "/login";
    }
  }

  return response;
}
