import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Hook to enforce authentication on a page
 * If user is not authenticated or user_id is missing, logs out and redirects to login
 * @param redirectPath - Path to redirect to after logout (default: /login)
 */
export function useRequireAuth(redirectPath: string = "/login") {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated or user_id is missing, logout and redirect
    if (!isAuthenticated || !user?.user_id) {
      const handleLogout = async () => {
        await logout();
        navigate(redirectPath, { replace: true });
      };
      handleLogout();
    }
  }, [isAuthenticated, user?.user_id, logout, navigate, redirectPath]);

  // Return auth status
  return {
    isAuthenticated: isAuthenticated && !!user?.user_id,
    user,
  };
}
