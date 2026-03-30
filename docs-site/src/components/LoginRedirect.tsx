
import React, { useEffect } from 'react';
import { docsAuthService } from '../services/docsAuthService';

interface LoginRedirectProps {
  redirectTo?: string;
}


export function LoginRedirect({ redirectTo }: LoginRedirectProps): JSX.Element {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get return URL from query params or use current location
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('return_to') || redirectTo || window.location.pathname;

    // Build login URL with redirect
    const mainAppUrl = process.env.REACT_APP_MAIN_APP_URL || 'http://localhost:3000';
    const loginUrl = `${mainAppUrl}/login?return_to=${encodeURIComponent(
      `${window.location.host}${returnTo}`
    )}`;

    // Redirect to main app login
    window.location.href = loginUrl;
  }, [redirectTo]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '16px',
        color: '#666',
      }}
    >
      <div>Redirecting to login...</div>
    </div>
  );
}

/**
 * Helper to check auth and redirect if needed
 */
export function checkAuthAndRedirect(): boolean {
  if (typeof window === 'undefined') return true;

  const token = docsAuthService.getAuthToken();
  const user = docsAuthService.getUser();

  if (!token || !user) {
    // Clear any stale data
    docsAuthService.clearAuth();
    // Redirect to login
    window.location.href = `${process.env.REACT_APP_MAIN_APP_URL || 'http://localhost:3000'}/login?return_to=${encodeURIComponent(window.location.href)}`;
    return false;
  }

  return true;
}
