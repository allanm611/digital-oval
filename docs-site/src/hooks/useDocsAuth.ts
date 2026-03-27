/**
 * Hook: useDocsAuth
 * Check if user is authenticated for docs access
 * Redirects to login if not authenticated
 */

import { useEffect, useState } from 'react';
import { useHistory } from '@docusaurus/router';
import { docsAuthService } from '../services/docsAuthService';

export interface UseDocsAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  logout: () => void;
}

/**
 * Hook to check if user is authenticated
 * Redirects to login if not
 */
export function useDocsAuth(): UseDocsAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);

      // Check if token exists
      const token = docsAuthService.getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        // Redirect to login
        history.push(`/login?return_to=${window.location.pathname}`);
        return;
      }

      // Validate token with backend
      const validation = await docsAuthService.validateToken();
      if (!validation.valid) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        // Redirect to login
        history.push(`/login?return_to=${window.location.pathname}`);
        return;
      }

      // Get user from localStorage
      const userData = docsAuthService.getUser();
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [history]);

  const logout = () => {
    docsAuthService.clearAuth();
    window.location.href = '/login';
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    logout,
  };
}
